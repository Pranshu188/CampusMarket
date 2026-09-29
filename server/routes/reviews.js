const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. POST /api/reviews — Leave rating & review for completed transaction
router.post('/', requireAuth, (req, res) => {
  try {
    const { seller_id, product_id, order_id, rental_id, rating, comment } = req.body;

    if (!seller_id || !rating || !comment) {
      return res.status(400).json({ error: 'Seller, star rating (1-5), and written comment are required.' });
    }

    const starRating = parseInt(rating);
    if (starRating < 1 || starRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
    }

    if (seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot rate yourself.' });
    }

    // Verify transaction eligibility (must have an order or rental as buyer/renter)
    if (order_id) {
      const order = db.prepare('SELECT id, buyer_id, seller_id FROM orders WHERE id = ?').get(order_id);
      if (!order || order.buyer_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only review sellers for orders you have placed.' });
      }

      const existingReview = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND reviewer_id = ?').get(order_id, req.user.id);
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this transaction.' });
      }
    } else if (rental_id) {
      const rental = db.prepare('SELECT id, renter_id, owner_id FROM rentals WHERE id = ?').get(rental_id);
      if (!rental || rental.renter_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only review owners for rentals you booked.' });
      }

      const existingReview = db.prepare('SELECT id FROM reviews WHERE rental_id = ? AND reviewer_id = ?').get(rental_id, req.user.id);
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this rental transaction.' });
      }
    }

    const insert = db.prepare(`
      INSERT INTO reviews (reviewer_id, seller_id, product_id, order_id, rental_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      req.user.id,
      seller_id,
      product_id || null,
      order_id || null,
      rental_id || null,
      starRating,
      comment.trim()
    );

    // Notify seller
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'New Student Review!', ?, 'review', '/profile')
    `).run(
      seller_id,
      `${req.user.name} rated you ${starRating} stars: "${comment.trim().substring(0, 50)}..."`
    );

    res.status(201).json({ message: 'Thank you! Your feedback helps build trust on CampusMarket.' });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// 2. GET /api/reviews/seller/:sellerId — Get seller reviews
router.get('/seller/:sellerId', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar, u.college as reviewer_college
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.seller_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.sellerId);

    res.json({ reviews });
  } catch (error) {
    console.error('Fetch seller reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
