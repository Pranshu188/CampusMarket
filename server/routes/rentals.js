const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. POST /api/rentals — Create Rental Request
router.post('/', requireAuth, (req, res) => {
  try {
    const { product_id, duration_months = 1, start_date, pickup_notes } = req.body;

    if (!product_id || !start_date) {
      return res.status(400).json({ error: 'Product and start date are required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.listing_type !== 'rent' && product.listing_type !== 'both') {
      return res.status(400).json({ error: 'This item is only available for purchase, not rental.' });
    }

    if (product.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot rent your own item.' });
    }

    const months = Math.max(1, parseInt(duration_months));
    const monthlyRent = product.rent_price_monthly || Math.round(product.price * 0.25);
    const deposit = product.security_deposit || Math.round(product.price * 0.8);
    const rentTotal = monthlyRent * months;
    const totalAmount = rentTotal + deposit;

    // Calculate end date based on duration
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + months);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    const rentalNumber = `CM-RNT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insertRental = db.prepare(`
      INSERT INTO rentals (
        rental_number, product_id, renter_id, owner_id,
        monthly_rent, security_deposit, duration_months, total_amount,
        start_date, end_date, payment_status, rental_status, deposit_status, pickup_notes
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'paid', 'active', 'held', ?
      )
    `);

    const result = insertRental.run(
      rentalNumber,
      product.id,
      req.user.id,
      product.seller_id,
      monthlyRent,
      deposit,
      months,
      totalAmount,
      start_date,
      endDateStr,
      pickup_notes || 'Campus handover arranged via CampusMarket chat'
    );

    // Update product availability to 'rented'
    db.prepare("UPDATE products SET availability = 'rented' WHERE id = ?").run(product.id);

    // Notifications
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Item Rented Out!', ?, 'rental', '/dashboard?tab=rentals')
    `).run(
      product.seller_id,
      `${req.user.name} rented "${product.title}" for ${months} month(s). Security deposit ₹${deposit} held safely.`
    );

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Rental Confirmed!', ?, 'rental', '/dashboard?tab=rentals')
    `).run(
      req.user.id,
      `Your rental for "${product.title}" is active until ${endDateStr}. Contact owner to receive item.`
    );

    const rental = db.prepare(`
      SELECT r.*, p.title as product_title, (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as owner_name, u.phone as owner_phone
      FROM rentals r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.owner_id = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Rental booked successfully!',
      rental
    });
  } catch (error) {
    console.error('Rental booking error:', error);
    res.status(500).json({ error: 'Failed to create rental.' });
  }
});

// 2. GET /api/rentals/my-rentals — Items rented by user (borrowed)
router.get('/my-rentals', requireAuth, (req, res) => {
  try {
    const rentals = db.prepare(`
      SELECT r.*, 
             p.title as product_title, 
             p.category_name,
             p.condition,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as owner_name, 
             u.email as owner_email,
             u.phone as owner_phone,
             (SELECT id FROM reviews WHERE rental_id = r.id AND reviewer_id = ?) as review_id
      FROM rentals r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.owner_id = u.id
      WHERE r.renter_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id, req.user.id);

    res.json({ rentals });
  } catch (error) {
    console.error('Fetch my-rentals error:', error);
    res.status(500).json({ error: 'Failed to fetch rentals.' });
  }
});

// 3. GET /api/rentals/my-lended — Items lent out by user
router.get('/my-lended', requireAuth, (req, res) => {
  try {
    const lended = db.prepare(`
      SELECT r.*, 
             p.title as product_title, 
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             u.name as renter_name, 
             u.email as renter_email,
             u.phone as renter_phone
      FROM rentals r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.renter_id = u.id
      WHERE r.owner_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    res.json({ lended });
  } catch (error) {
    console.error('Fetch lended error:', error);
    res.status(500).json({ error: 'Failed to fetch lent items.' });
  }
});

// 4. PATCH /api/rentals/:id/status — Update rental status or refund deposit
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { rental_status, deposit_status } = req.body;
    const id = req.params.id;

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental record not found.' });
    }

    if (rental.renter_id !== req.user.id && rental.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this rental.' });
    }

    if (rental_status) {
      db.prepare('UPDATE rentals SET rental_status = ? WHERE id = ?').run(rental_status, id);

      if (rental_status === 'returned' || rental_status === 'completed' || rental_status === 'cancelled') {
        db.prepare("UPDATE products SET availability = 'available' WHERE id = ?").run(rental.product_id);
      }
    }

    if (deposit_status) {
      db.prepare('UPDATE rentals SET deposit_status = ? WHERE id = ?').run(deposit_status, id);
    }

    res.json({ message: 'Rental status updated successfully.' });
  } catch (error) {
    console.error('Update rental status error:', error);
    res.status(500).json({ error: 'Failed to update rental status.' });
  }
});

module.exports = router;
