const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// 1. GET /api/categories — List categories with active product count
// By default, only returns categories that have available/active products
router.get('/', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const { all } = req.query;
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products WHERE category_name = c.name AND status = 'active') as active_count
      FROM categories c
    `;

    if (all !== 'true') {
      query += ` WHERE (SELECT COUNT(*) FROM products WHERE category_name = c.name AND status = 'active') > 0`;
    }

    query += ` ORDER BY c.name ASC`;
    const categories = db.prepare(query).all();

    res.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// 2. POST /api/categories — Admin create category
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const insert = db.prepare(`
      INSERT INTO categories (name, slug, icon, description)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), slug, icon || 'Package', description ? description.trim() : null);

    res.status(201).json({
      message: 'Category created successfully.',
      category: { id: insert.lastInsertRowid, name: name.trim(), slug, icon, description }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category. Ensure name is unique.' });
  }
});

// 3. PUT /api/categories/:id — Admin update category
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const id = req.params.id;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, icon = COALESCE(?, icon), description = COALESCE(?, description)
      WHERE id = ?
    `).run(name.trim(), slug, icon || null, description || null, id);

    res.json({ message: 'Category updated successfully.' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// 4. DELETE /api/categories/:id — Admin delete category
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

module.exports = router;
