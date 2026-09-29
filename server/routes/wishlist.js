const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. GET /api/wishlist — Get all saved items for user
router.get('/', requireAuth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        w.id as wishlist_id,
        w.created_at as saved_at,
        p.*,
        u.name as seller_name,
        u.college as seller_college,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(req.user.id);

    res.json({ wishlist: items });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch saved items.' });
  }
});

// 2. POST /api/wishlist/toggle — Add or Remove item from wishlist
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);

    if (existing) {
      db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id);
      return res.json({ message: 'Removed from wishlist', saved: false });
    } else {
      db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
      return res.json({ message: 'Saved to wishlist', saved: true });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
});

module.exports = router;
