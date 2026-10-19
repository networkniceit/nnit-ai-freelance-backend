// NNIT Freelancer Payments
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.get('/', (req, res) => res.json({ success: true, service: 'NNIT Freelancer Payments', stripeConfigured: !!stripe, webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET }));

router.post('/withdraw', authenticateJWT, async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, error: 'Stripe is not configured' });
  const { amount, currency, destination } = req.body;
  if (!amount || !currency || !destination) return res.status(400).json({ success: false, error: 'amount, currency and destination are required' });
  try {
    const payout = await stripe.payouts.create({ amount: Math.floor(Number(amount) * 100), currency, destination });
    res.json({ success: true, message: 'Payout initiated', payout });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// NNIT_SUBSCRIPTIONS_V1: saved account-bound billing status.
const billing = require('../services/nnitBilling');
const { protect } = require('../middleware/auth');
router.post('/create-subscription-session', protect, billing.checkout);
router.get('/subscription', protect, billing.status);
router.post('/portal', protect, billing.portal);
router.post('/webhook', express.raw({type:'application/json'}), billing.webhook);
module.exports = router;
