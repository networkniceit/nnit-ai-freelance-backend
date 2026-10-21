// NNIT Freelancer Payments
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.get('/', (req, res) => res.json({ success: true, service: 'NNIT Freelancer Payments', stripeConfigured: !!stripe, webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET }));

// NNIT_WITHDRAWAL_GUARD_V1
router.post('/withdraw', require('../middleware/auth').protect, (req, res) => {
  return res.status(409).json({
    success: false,
    code: 'WITHDRAWALS_NOT_ENABLED',
    error: 'Withdrawals are not enabled. Verified earnings and an account-owned payout destination are required.'
  });
});

// NNIT_SUBSCRIPTIONS_V1: saved account-bound billing status.
const billing = require('../services/nnitBilling');
const { protect } = require('../middleware/auth');
router.post('/create-subscription-session', protect, billing.checkout);
router.get('/subscription', protect, billing.status);
router.post('/portal', protect, billing.portal);
router.post('/webhook', express.raw({type:'application/json'}), billing.webhook);
module.exports = router;
