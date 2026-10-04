const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Temporary in-memory OTP cache for demo verification
const otpCache = new Map();

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 1. Register with Email
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, college, course, branch, semester, location, id_card_image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, college, course, branch, semester, location, avatar, verification_status, id_card_image)
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f766e,15803d,0369a1`;

    const info = insert.run(
      name.trim(),
      email.toLowerCase().trim(),
      phone || null,
      passwordHash,
      college || null,
      course || null,
      branch || null,
      semester ? parseInt(semester) : null,
      location || 'Campus',
      defaultAvatar,
      id_card_image || ''
    );

    const newUser = db.prepare('SELECT id, name, email, phone, role, college, course, branch, semester, location, bio, avatar, status, verification_status, id_card_image, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    const token = generateToken(newUser);

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      newUser.id,
      'Welcome to CampusMarket!',
      'Your student account is active! Campus verification is under review by administrator.',
      'system',
      '/dashboard'
    );

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create student account.' });
  }
});

// 2. Login with Email
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by CampusMarket moderators.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// 3. Send Phone OTP (Indian mobile format simulation)
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  // Generate 6 digit OTP (for test/demo convenience, return it in development response)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(phone.replace(/\D/g, ''), { otp, expires: Date.now() + 10 * 60 * 1000 });

  res.json({
    message: `OTP sent to ${phone}`,
    // Include debug_otp so user can test seamlessly without third-party SMS vendor setup
    debug_otp: otp
  });
});

// 4. Verify Phone OTP & Login / Auto-Register
router.post('/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const cached = otpCache.get(cleanPhone);

  // Allow standard '123456' fallback OTP for testing ease or cached OTP
  const isValid = (cached && cached.otp === otp) || otp === '123456';
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid or expired OTP. Use the code shown on screen or 123456.' });
  }

  // Look up user by phone or create new account
  let user = db.prepare('SELECT * FROM users WHERE phone LIKE ?').get(`%${cleanPhone}%`);
  if (!user) {
    const studentName = name || `Student ${cleanPhone.slice(-4)}`;
    const randomEmail = `student_${cleanPhone.slice(-6)}@campus.market`;
    const passwordHash = bcrypt.hashSync(Math.random().toString(), 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentName)}`;

    const insert = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, location, avatar)
      VALUES (?, ?, ?, ?, 'student', 'Campus', ?)
    `).run(studentName, randomEmail, `+91 ${cleanPhone}`, passwordHash, defaultAvatar);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(insert.lastInsertRowid);
  }

  otpCache.delete(cleanPhone);
  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({ user: safeUser, token });
});

// 5. Google Student Login Simulation
router.post('/google-login', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google account email is required.' });
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    const studentName = name || email.split('@')[0];
    const passwordHash = bcrypt.hashSync(Math.random().toString(), 10);
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentName)}`;

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, location, avatar)
      VALUES (?, ?, ?, 'student', 'College Campus', ?)
    `).run(studentName, email.toLowerCase().trim(), passwordHash, defaultAvatar);

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(insert.lastInsertRowid);
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  res.json({ user: safeUser, token });
});

// 6. Current User Me & Stats
router.get('/me', requireAuth, (req, res) => {
  const user = req.user;

  // Count unread notifications
  const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id).count;

  // Count unread messages
  const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0').get(user.id).count;

  // Count active listings
  const activeListings = db.prepare("SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status = 'active'").get(user.id).count;

  // Count saved wishlist items
  const wishlistCount = db.prepare('SELECT COUNT(*) as count FROM wishlist WHERE user_id = ?').get(user.id).count;

  res.json({
    user,
    counts: {
      unreadNotifications: unreadNotifs,
      unreadMessages: unreadMessages,
      activeListings: activeListings,
      wishlistCount: wishlistCount
    }
  });
});

// 7. Update Profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, college, course, branch, semester, location, bio, avatar } = req.body;
    
    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        college = COALESCE(?, college),
        course = COALESCE(?, course),
        branch = COALESCE(?, branch),
        semester = COALESCE(?, semester),
        location = COALESCE(?, location),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      phone ? phone.trim() : null,
      college ? college.trim() : null,
      course ? course.trim() : null,
      branch ? branch.trim() : null,
      semester ? parseInt(semester) : null,
      location ? location.trim() : null,
      bio ? bio.trim() : null,
      avatar || null,
      req.user.id
    );

    const updated = db.prepare('SELECT id, name, email, phone, role, college, course, branch, semester, location, bio, avatar FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// 8. Public Seller Profile
router.get('/seller/:id', (req, res) => {
  try {
    const seller = db.prepare(`
      SELECT id, name, college, course, branch, semester, location, bio, avatar, created_at
      FROM users WHERE id = ? AND status = 'active'
    `).get(req.params.id);

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found.' });
    }

    // Get active listings for this seller
    const listings = db.prepare(`
      SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      WHERE p.seller_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
    `).all(seller.id);

    // Get seller reviews & average rating
    const ratingStats = db.prepare(`
      SELECT COUNT(*) as review_count, AVG(rating) as avg_rating
      FROM reviews WHERE seller_id = ?
    `).get(seller.id);

    const reviews = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar, u.college as reviewer_college
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.seller_id = ?
      ORDER BY r.created_at DESC
    `).all(seller.id);

    res.json({
      seller: {
        ...seller,
        rating: ratingStats.avg_rating ? parseFloat(ratingStats.avg_rating.toFixed(1)) : 5.0,
        reviewCount: ratingStats.review_count || 0,
        listingsCount: listings.length
      },
      listings,
      reviews
    });
  } catch (error) {
    console.error('Seller profile error:', error);
    res.status(500).json({ error: 'Failed to fetch seller profile.' });
  }
});

module.exports = router;
