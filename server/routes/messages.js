const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. GET /api/messages/conversations — List all conversations for current user
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = db.prepare(`
      SELECT 
        c.*,
        p.title as product_title,
        p.price as product_price,
        p.listing_type as product_type,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
        CASE 
          WHEN c.buyer_id = ? THEN u_seller.id 
          ELSE u_buyer.id 
        END as other_user_id,
        CASE 
          WHEN c.buyer_id = ? THEN u_seller.name 
          ELSE u_buyer.name 
        END as other_user_name,
        CASE 
          WHEN c.buyer_id = ? THEN u_seller.avatar 
          ELSE u_buyer.avatar 
        END as other_user_avatar,
        CASE 
          WHEN c.buyer_id = ? THEN u_seller.college 
          ELSE u_buyer.college 
        END as other_user_college,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND recipient_id = ? AND is_read = 0) as unread_count
      FROM conversations c
      LEFT JOIN products p ON c.product_id = p.id
      JOIN users u_buyer ON c.buyer_id = u_buyer.id
      JOIN users u_seller ON c.seller_id = u_seller.id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId, userId, userId, userId, userId, userId, userId);

    res.json({ conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// 2. GET /api/messages/conversations/:id — Get conversation messages and details
router.get('/conversations/:id', requireAuth, (req, res) => {
  try {
    const convId = req.params.id;
    const userId = req.user.id;

    const conversation = db.prepare(`
      SELECT c.*,
             p.title as product_title,
             p.price as product_price,
             p.listing_type as product_type,
             p.condition as product_condition,
             p.location as product_location,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image,
             CASE WHEN c.buyer_id = ? THEN u_seller.id ELSE u_buyer.id END as other_user_id,
             CASE WHEN c.buyer_id = ? THEN u_seller.name ELSE u_buyer.name END as other_user_name,
             CASE WHEN c.buyer_id = ? THEN u_seller.avatar ELSE u_buyer.avatar END as other_user_avatar,
             CASE WHEN c.buyer_id = ? THEN u_seller.college ELSE u_buyer.college END as other_user_college
      FROM conversations c
      LEFT JOIN products p ON c.product_id = p.id
      JOIN users u_buyer ON c.buyer_id = u_buyer.id
      JOIN users u_seller ON c.seller_id = u_seller.id
      WHERE c.id = ? AND (c.buyer_id = ? OR c.seller_id = ?)
    `).get(userId, userId, userId, userId, convId, userId, userId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    // Mark messages sent to current user as read
    db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND recipient_id = ?').run(convId, userId);

    // Fetch messages
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).all(convId);

    res.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error('Fetch conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
});

// 3. POST /api/messages — Start conversation or Send message
router.post('/', requireAuth, (req, res) => {
  try {
    const { product_id, seller_id, conversation_id, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    let convId = conversation_id;
    let recipientId = seller_id;

    if (!convId) {
      if (!product_id || !seller_id) {
        return res.status(400).json({ error: 'Product and seller details required to start a chat.' });
      }

      if (seller_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot start a conversation with yourself.' });
      }

      // Check existing conversation
      const existing = db.prepare(`
        SELECT id FROM conversations
        WHERE buyer_id = ? AND seller_id = ? AND product_id = ?
      `).get(req.user.id, seller_id, product_id);

      if (existing) {
        convId = existing.id;
      } else {
        const createConv = db.prepare(`
          INSERT INTO conversations (buyer_id, seller_id, product_id, last_message, last_message_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(req.user.id, seller_id, product_id, text.trim());
        convId = createConv.lastInsertRowid;
      }
    } else {
      // Find recipient from existing conversation
      const conv = db.prepare('SELECT buyer_id, seller_id FROM conversations WHERE id = ?').get(convId);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
      recipientId = conv.buyer_id === req.user.id ? conv.seller_id : conv.buyer_id;
    }

    // Insert message
    const insertMsg = db.prepare(`
      INSERT INTO messages (conversation_id, sender_id, recipient_id, text)
      VALUES (?, ?, ?, ?)
    `).run(convId, req.user.id, recipientId, text.trim());

    // Update conversation last message
    db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(text.trim(), convId);

    // Create notification for recipient
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (?, ?, ?, 'message', ?)
    `).run(
      recipientId,
      `New message from ${req.user.name}`,
      text.trim().length > 60 ? `${text.trim().substring(0, 60)}...` : text.trim(),
      `/messages?id=${convId}`
    );

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(insertMsg.lastInsertRowid);

    res.status(201).json({
      conversation_id: convId,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
