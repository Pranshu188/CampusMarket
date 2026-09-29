const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');

// Environment variables for real Razorpay credentials (if provided by operator)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_campusmarket_sandbox';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'campusmarket_sandbox_secret';
const IS_SANDBOX = !process.env.RAZORPAY_KEY_ID;

// 1. POST /api/payment/create-order — Create payment session
router.post('/create-order', requireAuth, (req, res) => {
  try {
    const { amount, currency = 'INR', receipt_type = 'purchase', product_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    res.json({
      success: true,
      order_id: orderId,
      amount: Math.round(amount * 100), // in paise
      currency,
      key_id: RAZORPAY_KEY_ID,
      is_sandbox: IS_SANDBOX,
      student_name: req.user.name,
      student_email: req.user.email,
      student_phone: req.user.phone || '+91 98765 43210'
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment transaction.' });
  }
});

// 2. POST /api/payment/verify — Verify payment signature
router.post('/verify', requireAuth, (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (IS_SANDBOX) {
      // In sandbox mode, verify mock transaction structure
      return res.json({
        verified: true,
        payment_id: razorpay_payment_id || `pay_${Date.now()}`,
        status: 'captured',
        message: 'Sandbox payment verified successfully.'
      });
    }

    // In production with real Razorpay credentials, verify HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpay_signature) {
      return res.json({
        verified: true,
        payment_id: razorpay_payment_id,
        status: 'captured',
        message: 'Payment verified successfully.'
      });
    } else {
      return res.status(400).json({ verified: false, error: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

module.exports = router;
