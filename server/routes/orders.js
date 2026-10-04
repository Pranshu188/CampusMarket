const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. POST /api/orders — Create Order (Buy Now)
router.post('/', requireAuth, (req, res) => {
  try {
    const { 
      product_id, 
      payment_method = 'CampusMarket UPI QR (Online Escrow)', 
      payment_status,
      utr_number = '',
      transaction_id = '',
      pickup_notes 
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product.' });
    }

    if (product.availability !== 'available') {
      return res.status(400).json({ error: 'This item is no longer available.' });
    }

    const isCod = payment_method.toLowerCase().includes('cod') || 
                  payment_method.toLowerCase().includes('handover') || 
                  payment_status === 'pending_handover' ||
                  payment_status === 'pending_pickup';

    const cleanUtr = (utr_number || '').trim().replace(/\s+/g, '');
    const actualPaymentStatus = isCod ? 'pending_handover' : 'escrow_held';
    const actualEscrowStatus = isCod ? 'cod' : 'held';
    const actualOrderStatus = isCod ? 'pending_pickup' : 'confirmed';
    const actualTxnId = isCod 
      ? 'COD-CAMPUS-HANDOVER' 
      : (cleanUtr ? `UTR-${cleanUtr}` : (transaction_id || `CM-ESC-${Date.now()}`));

    const orderNumber = `CM-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, product_id, buyer_id, seller_id, amount,
        payment_method, payment_status, order_status, pickup_notes, transaction_id, utr_number, escrow_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertOrder.run(
      orderNumber,
      product.id,
      req.user.id,
      product.seller_id,
      product.price,
      isCod ? 'Cash on Campus Handover (COD)' : 'CampusMarket UPI QR (Online Escrow)',
      actualPaymentStatus,
      actualOrderStatus,
      pickup_notes || 'Pickup arranged on campus via CampusMarket chat',
      actualTxnId,
      cleanUtr,
      actualEscrowStatus
    );

    // Update product availability to 'sold'
    db.prepare("UPDATE products SET availability = 'sold' WHERE id = ?").run(product.id);

    // 1. Send Notification to Seller with exact details
    const sellerNotifTitle = isCod 
      ? 'New Order (Cash on Handover)' 
      : `CampusMarket Escrow: Payment Received for "${product.title}"!`;

    const sellerNotifMsg = isCod
      ? `${req.user.name} ordered "${product.title}" for ₹${product.price} (Cash on Handover). Coordinate meetup in chat to hand over item and collect payment.`
      : `CampusMarket Admin: Payment of ₹${product.price} from buyer ${req.user.name} (Phone: ${req.user.phone || 'Available in chat'}) for "${product.title}" (UTR: ${cleanUtr || actualTxnId}) is safely held in CampusMarket Escrow. Handover location: "${pickup_notes || 'College Campus'}". Once the buyer receives the book and marks it received, money will be transferred to your account!`;

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'order', '/dashboard?tab=orders')
    `).run(product.seller_id, sellerNotifTitle, sellerNotifMsg);

    // 2. Send Notification to Buyer
    const buyerNotifTitle = isCod 
      ? 'Order Placed (Cash on Handover)' 
      : 'Order Placed & Protected by CampusMarket Escrow!';

    const buyerNotifMsg = isCod
      ? `Your order for "${product.title}" is reserved! Meet the seller on campus to inspect item and pay ₹${product.price}.`
      : `Your payment of ₹${product.price} (UTR: ${cleanUtr || actualTxnId}) is held safely in CampusMarket Escrow. Meet ${product.seller_name} to collect your item. Once received, click "Mark Received" in your orders to release funds to the seller.`;

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'order', '/dashboard?tab=orders')
    `).run(req.user.id, buyerNotifTitle, buyerNotifMsg);

    // 3. Post automatic Escrow Notice in buyer-seller chat
    try {
      let conv = db.prepare('SELECT id FROM conversations WHERE buyer_id = ? AND seller_id = ? AND product_id = ?').get(req.user.id, product.seller_id, product.id);
      if (!conv) {
        const convRes = db.prepare(`
          INSERT INTO conversations (buyer_id, seller_id, product_id, last_message, last_message_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(req.user.id, product.seller_id, product.id, 'Order Placed');
        conv = { id: convRes.lastInsertRowid };
      }

      const escrowAlertText = !isCod
        ? `🛡️ [CampusMarket Admin Escrow Notice]\nBuyer ${req.user.name} has submitted payment of ₹${product.price} via CampusMarket UPI QR.\nUTR Ref: ${cleanUtr || actualTxnId}\nStatus: Funds held safely in Admin Escrow.\nMeetup Location: ${pickup_notes || 'College Campus'}.\nOnce buyer receives the item and clicks "Mark Received", funds are released to the seller.`
        : `🤝 [CampusMarket COD Notice]\nBuyer ${req.user.name} placed a Cash on Campus Handover order for ₹${product.price}.\nPlease arrange meeting at "${pickup_notes || 'College Campus'}" to inspect and exchange.`;

      db.prepare(`
        INSERT INTO messages (conversation_id, sender_id, recipient_id, text, is_read)
        VALUES (?, ?, ?, ?, 0)
      `).run(conv.id, req.user.id, product.seller_id, escrowAlertText);

      db.prepare('UPDATE conversations SET last_message = ?, last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        escrowAlertText.slice(0, 100) + '...',
        conv.id
      );
    } catch (e) {
      console.error('Chat auto-message error:', e);
    }

    const order = db.prepare(`
      SELECT o.*, p.title as product_title, (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as seller_name, u.phone as seller_phone
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.seller_id = u.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to complete order.' });
  }
});

// 2. GET /api/orders/my-orders — Orders placed by current user
router.get('/my-orders', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, 
             p.title as product_title, 
             p.category_name,
             p.condition,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as seller_name, 
             u.email as seller_email,
             u.phone as seller_phone,
             u.college as seller_college,
             (SELECT id FROM reviews WHERE order_id = o.id AND reviewer_id = ?) as review_id
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id, req.user.id);

    res.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// 3. GET /api/orders/my-sales — Orders received by current user (as seller)
router.get('/my-sales', requireAuth, (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT o.*, 
             p.title as product_title, 
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as buyer_name, 
             u.email as buyer_email,
             u.phone as buyer_phone,
             u.college as buyer_college
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    res.json({ sales });
  } catch (error) {
    console.error('Fetch sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales.' });
  }
});

// 4. PATCH /api/orders/:id/status — Update order status (Mark Received / Release Escrow)
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body; // 'confirmed', 'completed', 'cancelled'
    const id = req.params.id;

    const order = db.prepare('SELECT o.*, p.title as product_title FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this order.' });
    }

    if (status === 'completed') {
      db.prepare(`
        UPDATE orders 
        SET order_status = 'completed', 
            payment_status = 'paid', 
            escrow_status = 'released' 
        WHERE id = ?
      `).run(id);

      // Notify seller that money has been released
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, '🎉 Escrow Funds Released!', ?, 'order', '/dashboard?tab=orders')
      `).run(
        order.seller_id,
        `Buyer has confirmed receiving "${order.product_title}"! The escrow payout of ₹${order.amount} is released to your account.`
      );

      // Notify buyer that order is completed
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (?, 'Order Completed!', ?, 'order', '/dashboard?tab=orders')
      `).run(
        order.buyer_id,
        `Thank you for confirming receipt of "${order.product_title}". The transaction is complete and funds have been released to the seller.`
      );
    } else {
      db.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(status, id);
    }

    // If cancelled, make product available again
    if (status === 'cancelled') {
      db.prepare("UPDATE products SET availability = 'available' WHERE id = ?").run(order.product_id);
    }

    res.json({ message: `Order status updated to ${status}.` });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
