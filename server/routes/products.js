const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Setup upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, WEBP and GIF image formats are permitted.'));
  }
});

// 1. GET /api/products — Search & Multi-field Filtering
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      search,
      category,
      type, // 'sell', 'rent'
      min_price,
      max_price,
      condition,
      college,
      course,
      branch,
      semester,
      subject,
      location,
      sort,
      page = 1,
      limit = 24
    } = req.query;

    let conditions = ["p.status = 'active'"];
    let params = [];

    // Full text search across title, description, category, subject, course, college, author, isbn
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(`(
        p.title LIKE ? OR 
        p.description LIKE ? OR 
        p.category_name LIKE ? OR 
        p.subject LIKE ? OR 
        p.course LIKE ? OR 
        p.college LIKE ? OR 
        p.author LIKE ? OR 
        p.isbn LIKE ?
      )`);
      params.push(q, q, q, q, q, q, q, q);
    }

    if (category && category !== 'All' && category.trim()) {
      conditions.push('p.category_name = ?');
      params.push(category.trim());
    }

    if (type && type !== 'all') {
      if (type === 'sell') {
        conditions.push("(p.listing_type = 'sell' OR p.listing_type = 'both')");
      } else if (type === 'rent') {
        conditions.push("(p.listing_type = 'rent' OR p.listing_type = 'both')");
      }
    }

    if (min_price) {
      conditions.push('p.price >= ?');
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push('p.price <= ?');
      params.push(parseFloat(max_price));
    }

    if (condition && condition !== 'All') {
      conditions.push('p.condition = ?');
      params.push(condition);
    }

    if (college && college.trim()) {
      conditions.push('p.college LIKE ?');
      params.push(`%${college.trim()}%`);
    }

    if (course && course.trim()) {
      conditions.push('p.course LIKE ?');
      params.push(`%${course.trim()}%`);
    }

    if (branch && branch.trim()) {
      conditions.push('p.branch LIKE ?');
      params.push(`%${branch.trim()}%`);
    }

    if (semester && semester !== 'All') {
      conditions.push('p.semester = ?');
      params.push(parseInt(semester));
    }

    if (subject && subject.trim()) {
      conditions.push('p.subject LIKE ?');
      params.push(`%${subject.trim()}%`);
    }

    if (location && location.trim()) {
      conditions.push('p.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'ORDER BY p.price DESC';
    } else if (sort === 'views') {
      orderBy = 'ORDER BY p.views_count DESC';
    } else if (sort === 'newest') {
      orderBy = 'ORDER BY p.created_at DESC';
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit)));
    const offset = (pageNum - 1) * pageLimit;

    // Total count query
    const countSql = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const totalCount = db.prepare(countSql).get(...params).total;

    // Fetch products
    const querySql = `
      SELECT 
        p.*,
        u.name as seller_name,
        u.avatar as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      JOIN users u ON p.seller_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const products = db.prepare(querySql).all(...params, pageLimit, offset);

    // If user is logged in, attach wishlist status
    if (req.user) {
      const userWishlist = new Set(
        db.prepare('SELECT product_id FROM wishlist WHERE user_id = ?').all(req.user.id).map(w => w.product_id)
      );
      products.forEach(p => {
        p.is_wishlisted = userWishlist.has(p.id);
      });
    }

    res.json({
      products,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: pageLimit,
        totalPages: Math.ceil(totalCount / pageLimit)
      }
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to retrieve marketplace products.' });
  }
});

// 2. GET /api/products/:id — Product Details Page
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const id = req.params.id;

    // Increment views
    db.prepare('UPDATE products SET views_count = views_count + 1 WHERE id = ?').run(id);

    const product = db.prepare(`
      SELECT 
        p.*,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        u.avatar as seller_avatar,
        u.college as seller_college,
        u.created_at as seller_joined_at
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found or has been removed.' });
    }

    // Check permissions if product is pending or rejected
    if (product.status !== 'active') {
      const isOwner = req.user && req.user.id === product.seller_id;
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ error: 'This product listing is pending moderation approval.' });
      }
    }

    // Get all images
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC').all(id);

    // Get seller rating and review count
    const sellerStats = db.prepare(`
      SELECT COUNT(*) as review_count, AVG(rating) as avg_rating
      FROM reviews WHERE seller_id = ?
    `).get(product.seller_id);

    product.seller_rating = sellerStats.avg_rating ? parseFloat(sellerStats.avg_rating.toFixed(1)) : 5.0;
    product.seller_review_count = sellerStats.review_count || 0;

    // Check wishlist status for logged in user
    if (req.user) {
      const wish = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, id);
      product.is_wishlisted = !!wish;
    } else {
      product.is_wishlisted = false;
    }

    // Related products from same category or college
    const related = db.prepare(`
      SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      WHERE (p.category_name = ? OR p.college = ?) AND p.id != ? AND p.status = 'active'
      LIMIT 4
    `).all(product.category_name, product.college, id);

    res.json({
      product,
      images,
      related
    });
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// 3. POST /api/products/upload-images — Upload Product Images
router.post('/upload-images', requireAuth, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded.' });
    }
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images.' });
  }
});

// 4. POST /api/products — Create Product Listing
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      title,
      description,
      category_name,
      price,
      listing_type = 'sell',
      rent_price_monthly,
      security_deposit,
      rental_terms,
      condition,
      college,
      course,
      branch,
      semester,
      subject,
      edition,
      author,
      isbn,
      location,
      contact_preference = 'CampusMarket Chat',
      images = []
    } = req.body;

    if (!title || !description || !price || !condition || !location) {
      return res.status(400).json({ error: 'Title, description, price, condition, and location are required.' });
    }

    // Check moderation policy
    const approvalSetting = db.prepare("SELECT value FROM settings WHERE key = 'require_approval'").get();
    const requireApproval = approvalSetting && approvalSetting.value === 'true';
    const status = requireApproval ? 'pending_approval' : 'active';

    const insertProduct = db.prepare(`
      INSERT INTO products (
        title, description, category_name, seller_id, price, listing_type,
        rent_price_monthly, security_deposit, rental_terms, condition,
        college, course, branch, semester, subject, edition, author, isbn,
        location, contact_preference, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    const result = insertProduct.run(
      title.trim(),
      description.trim(),
      category_name || 'Stationery',
      req.user.id,
      parseFloat(price),
      listing_type,
      rent_price_monthly ? parseFloat(rent_price_monthly) : null,
      security_deposit ? parseFloat(security_deposit) : null,
      rental_terms || null,
      condition,
      college ? college.trim() : null,
      course ? course.trim() : null,
      branch ? branch.trim() : null,
      semester ? parseInt(semester) : null,
      subject ? subject.trim() : null,
      edition ? edition.trim() : null,
      author ? author.trim() : null,
      isbn ? isbn.trim() : null,
      location.trim(),
      contact_preference,
      status
    );

    const productId = result.lastInsertRowid;

    // Insert images
    const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)');
    if (images && images.length > 0) {
      images.forEach((imgUrl, idx) => {
        insertImg.run(productId, imgUrl, idx === 0 ? 1 : 0);
      });
    } else {
      // Default fallback student item image
      insertImg.run(productId, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 1);
    }

    // Create confirmation notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      status === 'active' ? 'Listing Live!' : 'Listing Under Review',
      status === 'active' 
        ? `"${title}" has been published and is now visible to students.` 
        : `"${title}" has been submitted for quick moderator approval.`,
      'approval',
      `/products/${productId}`
    );

    res.status(201).json({
      message: status === 'active' ? 'Listing published successfully!' : 'Listing submitted for admin approval.',
      productId,
      status
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create listing.' });
  }
});

// 5. PUT /api/products/:id — Edit Product Listing
router.put('/:id', requireAuth, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this listing.' });
    }

    const {
      title,
      description,
      category_name,
      price,
      listing_type,
      rent_price_monthly,
      security_deposit,
      rental_terms,
      condition,
      college,
      course,
      branch,
      semester,
      subject,
      edition,
      author,
      isbn,
      location,
      availability,
      contact_preference,
      images
    } = req.body;

    db.prepare(`
      UPDATE products SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category_name = COALESCE(?, category_name),
        price = COALESCE(?, price),
        listing_type = COALESCE(?, listing_type),
        rent_price_monthly = COALESCE(?, rent_price_monthly),
        security_deposit = COALESCE(?, security_deposit),
        rental_terms = COALESCE(?, rental_terms),
        condition = COALESCE(?, condition),
        college = COALESCE(?, college),
        course = COALESCE(?, course),
        branch = COALESCE(?, branch),
        semester = COALESCE(?, semester),
        subject = COALESCE(?, subject),
        edition = COALESCE(?, edition),
        author = COALESCE(?, author),
        isbn = COALESCE(?, isbn),
        location = COALESCE(?, location),
        availability = COALESCE(?, availability),
        contact_preference = COALESCE(?, contact_preference),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description ? description.trim() : null,
      category_name || null,
      price ? parseFloat(price) : null,
      listing_type || null,
      rent_price_monthly ? parseFloat(rent_price_monthly) : null,
      security_deposit ? parseFloat(security_deposit) : null,
      rental_terms || null,
      condition || null,
      college || null,
      course || null,
      branch || null,
      semester ? parseInt(semester) : null,
      subject || null,
      edition || null,
      author || null,
      isbn || null,
      location || null,
      availability || null,
      contact_preference || null,
      id
    );

    // If new images provided, update them
    if (images && Array.isArray(images) && images.length > 0) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)');
      images.forEach((imgUrl, idx) => {
        insertImg.run(id, imgUrl, idx === 0 ? 1 : 0);
      });
    }

    res.json({ message: 'Product updated successfully.' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// 6. DELETE /api/products/:id — Delete Listing
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

// 7. POST /api/products/:id/report — Report Product Listing
router.post('/:id/report', requireAuth, (req, res) => {
  try {
    const productId = req.params.id;
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Please select a reason for reporting.' });
    }

    const product = db.prepare('SELECT title FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product listing not found.' });
    }

    db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, target_title, reason, details)
      VALUES (?, 'product', ?, ?, ?, ?)
    `).run(
      req.user.id,
      productId,
      product.title,
      reason,
      details ? details.trim() : null
    );

    res.status(201).json({ message: 'Report submitted. CampusMarket moderators will review this listing.' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

module.exports = router;
