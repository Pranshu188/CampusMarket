const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. POST /api/orders — Create Order (Buy Now)
router.post('/', requireAuth, (req, res) => {
  try {
    const { 
      product_id, 
      payment_method = 'UPI / CampusPay', 
      payment_status = 'paid',
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

    const isHandover = payment_status === 'pending_pickup' || payment_method.toLowerCase().includes('handover');
    const actualPaymentStatus = isHandover ? 'pending_pickup' : 'paid';
    const actualOrderStatus = isHandover ? 'pending_pickup' : 'confirmed';
    const actualTxnId = transaction_id || (isHandover ? 'HANDOVER-PENDING' : `pay_cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

    const orderNumber = `CM-ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, product_id, buyer_id, seller_id, amount, payment_method, payment_status, order_status, pickup_notes, transaction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertOrder.run(
      orderNumber,
      product.id,
      req.user.id,
      product.seller_id,
      product.price,
      payment_method,
      actualPaymentStatus,
      actualOrderStatus,
      pickup_notes || 'Pickup arranged on campus via CampusMarket chat',
      actualTxnId
    );

    // Update product availability to 'sold'
    db.prepare("UPDATE products SET availability = 'sold' WHERE id = ?").run(product.id);

    // Send notification to Seller
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'order', '/dashboard?tab=orders')
    `).run(
      product.seller_id,
      isHandover ? 'New Order (Pay on Handover)' : 'Item Sold & Paid!',
      isHandover
        ? `${req.user.name} ordered "${product.title}" for ₹${product.price} (Pay on Campus Handover). Coordinate meetup in chat to hand over item and collect payment.`
        : `${req.user.name} bought "${product.title}" for ₹${product.price}. Payment verified (${payment_method}, Ref: ${actualTxnId}). Please coordinate campus handover.`
    );

    // Send notification to Buyer
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'order', '/dashboard?tab=orders')
    `).run(
      req.user.id,
      isHandover ? 'Order Placed (Pay at Meetup)' : 'Order & Payment Confirmed!',
      isHandover
        ? `Your order for "${product.title}" is reserved! Meet seller on campus to inspect item and pay ₹${product.price}.`
        : `Your payment of ₹${product.price} for "${product.title}" was verified (Ref: ${actualTxnId}). Connect with seller to coordinate pickup.`
    );

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
    console.error('Fetch my-orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// 3. GET /api/orders/my-sales — Orders where current user is seller
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

// 4. PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body; // 'confirmed', 'completed', 'cancelled'
    const id = req.params.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this order.' });
    }

    if (status === 'completed') {
      db.prepare("UPDATE orders SET order_status = 'completed', payment_status = 'paid' WHERE id = ?").run(id);
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
