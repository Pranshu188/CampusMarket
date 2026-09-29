const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// All routes here require Admin role
router.use(requireAdmin);

// 1. GET /api/admin/stats — Dashboard metrics overview
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalListings = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'active'").get().count;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'pending_approval'").get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRentals = db.prepare('SELECT COUNT(*) as count FROM rentals').get().count;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;
    const totalRequests = db.prepare("SELECT COUNT(*) as count FROM requests WHERE status = 'open'").get().count;

    // Financial volume
    const orderVolume = db.prepare("SELECT SUM(amount) as sum FROM orders WHERE payment_status = 'paid'").get().sum || 0;
    const rentalVolume = db.prepare("SELECT SUM(total_amount) as sum FROM rentals WHERE payment_status = 'paid'").get().sum || 0;

    // Approval requirement setting
    const approvalSetting = db.prepare("SELECT value FROM settings WHERE key = 'require_approval'").get();

    res.json({
      stats: {
        totalUsers,
        totalListings,
        pendingApprovals,
        totalOrders,
        totalRentals,
        pendingReports,
        totalRequests,
        marketplaceVolume: orderVolume + rentalVolume,
        requireApproval: approvalSetting ? approvalSetting.value === 'true' : false
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

// 2. GET /api/admin/products — Moderation listing
router.get('/products', (req, res) => {
  try {
    const { status = 'all', search } = req.query;
    let conditions = [];
    let params = [];

    if (status && status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push('(p.title LIKE ? OR p.college LIKE ? OR u.name LIKE ?)');
      const q = `%${search.trim()}%`;
      params.push(q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const products = db.prepare(`
      SELECT 
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        u.college as seller_college,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `).all(...params);

    res.json({ products });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ error: 'Failed to fetch moderation products.' });
  }
});

// 3. PATCH /api/admin/products/:id/approve — Approve product listing
router.patch('/products/:id/approve', (req, res) => {
  try {
    const id = req.params.id;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare("UPDATE products SET status = 'active', rejection_reason = NULL WHERE id = ?").run(id);

    // Notify seller
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Listing Approved!', ?, 'approval', ?)
    `).run(
      product.seller_id,
      `Your listing "${product.title}" has been approved by moderators and is now live!`,
      `/products/${product.id}`
    );

    res.json({ message: 'Product listing approved and published live.' });
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ error: 'Failed to approve product.' });
  }
});

// 4. PATCH /api/admin/products/:id/reject — Reject product listing
router.patch('/products/:id/reject', (req, res) => {
  try {
    const id = req.params.id;
    const { reason = 'Does not meet CampusMarket student guidelines.' } = req.body;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare("UPDATE products SET status = 'rejected', rejection_reason = ? WHERE id = ?").run(reason, id);

    // Notify seller
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, 'Listing Requires Changes', ?, 'approval', '/dashboard?tab=listings')
    `).run(
      product.seller_id,
      `Your listing "${product.title}" was not approved: ${reason}. You can edit and resubmit.`
    );

    res.json({ message: 'Product rejected.' });
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ error: 'Failed to reject product.' });
  }
});

// 5. GET /api/admin/users — Manage student accounts
router.get('/users', (req, res) => {
  try {
    const { search, status } = req.query;
    let conditions = ["role = 'student'"];
    let params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(name LIKE ? OR email LIKE ? OR college LIKE ? OR phone LIKE ?)');
      params.push(q, q, q, q);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const users = db.prepare(`
      SELECT id, name, email, phone, college, course, branch, semester, location, status, created_at,
             (SELECT COUNT(*) FROM products WHERE seller_id = users.id) as listing_count,
             (SELECT COUNT(*) FROM orders WHERE buyer_id = users.id) as order_count
      FROM users
      ${where}
      ORDER BY created_at DESC
    `).all(...params);

    res.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// 6. PATCH /api/admin/users/:id/status — Suspend or Activate user
router.patch('/users/:id/status', (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'suspended'
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: `User status changed to ${status}.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// 7. GET /api/admin/orders & GET /api/admin/rentals
router.get('/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, p.title as product_title, u_buyer.name as buyer_name, u_seller.name as seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u_buyer ON o.buyer_id = u_buyer.id
      JOIN users u_seller ON o.seller_id = u_seller.id
      ORDER BY o.created_at DESC
    `).all();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

router.get('/rentals', (req, res) => {
  try {
    const rentals = db.prepare(`
      SELECT r.*, p.title as product_title, u_renter.name as renter_name, u_owner.name as owner_name
      FROM rentals r
      JOIN products p ON r.product_id = p.id
      JOIN users u_renter ON r.renter_id = u_renter.id
      JOIN users u_owner ON r.owner_id = u_owner.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ rentals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rentals.' });
  }
});

// 8. GET /api/admin/reports & PATCH /api/admin/reports/:id
router.get('/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, u.name as reporter_name, u.email as reporter_email
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

router.patch('/reports/:id', (req, res) => {
  try {
    const { status, admin_action } = req.body; // 'resolved' or 'dismissed'
    db.prepare('UPDATE reports SET status = ?, admin_action = ? WHERE id = ?').run(status, admin_action || null, req.params.id);
    res.json({ message: `Report marked as ${status}.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// 9. GET /api/admin/reviews & DELETE /api/admin/reviews/:id
router.get('/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u_rev.name as reviewer_name, u_sel.name as seller_name, p.title as product_title
      FROM reviews r
      JOIN users u_rev ON r.reviewer_id = u_rev.id
      JOIN users u_sel ON r.seller_id = u_sel.id
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

router.delete('/reviews/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ message: 'Review removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// 10. PATCH /api/admin/settings — Toggle approval settings
router.patch('/settings', (req, res) => {
  try {
    const { require_approval } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('require_approval', require_approval ? 'true' : 'false');
    res.json({ message: 'Settings saved.', require_approval: !!require_approval });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
