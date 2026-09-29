const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// 1. GET /api/requests — Browse community requests
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, category, college, course, semester, type } = req.query;

    let conditions = ["r.status = 'open'"];
    let params = [];

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(`(r.title LIKE ? OR r.description LIKE ? OR r.subject LIKE ? OR r.course LIKE ? OR r.college LIKE ?)`);
      params.push(q, q, q, q, q);
    }

    if (category && category !== 'All') {
      conditions.push('r.category_name = ?');
      params.push(category);
    }

    if (college && college.trim()) {
      conditions.push('r.college LIKE ?');
      params.push(`%${college.trim()}%`);
    }

    if (course && course.trim()) {
      conditions.push('r.course LIKE ?');
      params.push(`%${course.trim()}%`);
    }

    if (semester && semester !== 'All') {
      conditions.push('r.semester = ?');
      params.push(parseInt(semester));
    }

    if (type && type !== 'All') {
      conditions.push('r.preferred_type = ?');
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const requests = db.prepare(`
      SELECT r.*, u.name as requester_name, u.avatar as requester_avatar, u.college as requester_college, u.email as requester_email
      FROM requests r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `).all(...params);

    res.json({ requests });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch student requests.' });
  }
});

// 2. POST /api/requests — Create new item request
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      title,
      description,
      category_name,
      college,
      course,
      semester,
      subject,
      budget,
      preferred_type = 'Buy',
      location,
      required_by_date
    } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Title, description and location are required.' });
    }

    const insert = db.prepare(`
      INSERT INTO requests (
        user_id, title, description, category_name, college, course,
        semester, subject, budget, preferred_type, location, required_by_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    const result = insert.run(
      req.user.id,
      title.trim(),
      description.trim(),
      category_name || 'Textbooks',
      college ? college.trim() : (req.user.college || null),
      course ? course.trim() : (req.user.course || null),
      semester ? parseInt(semester) : (req.user.semester || null),
      subject ? subject.trim() : null,
      budget ? parseFloat(budget) : null,
      preferred_type,
      location.trim(),
      required_by_date || null
    );

    res.status(201).json({
      message: 'Item request posted! Students who have this item can contact you.',
      requestId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to post item request.' });
  }
});

// 3. GET /api/requests/my-requests — Current user's requests
router.get('/my-requests', requireAuth, (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT * FROM requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ requests });
  } catch (error) {
    console.error('Fetch user requests error:', error);
    res.status(500).json({ error: 'Failed to fetch your requests.' });
  }
});

// 4. PATCH /api/requests/:id/status — Update request status (fulfilled, cancelled)
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const id = req.params.id;

    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    if (request.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this request.' });
    }

    db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Request status updated successfully.' });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

// 5. DELETE /api/requests/:id — Delete request
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const id = req.params.id;
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    if (request.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this request.' });
    }

    db.prepare('DELETE FROM requests WHERE id = ?').run(id);
    res.json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request.' });
  }
});

module.exports = router;
