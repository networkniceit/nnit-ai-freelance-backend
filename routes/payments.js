// Stripe payment integration (Node.js/Express)
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Set your Stripe secret key in env
const { authenticateJWT } = require('../middleware/authenticateJWT');

// Withdraw endpoint
router.post('/withdraw', authenticateJWT, async (req, res) => {
    const { amount, currency, destination } = req.body;
    try {
        // Create a payout (to bank or card)
        const payout = await stripe.payouts.create({
            amount: Math.floor(amount * 100), // Stripe uses cents
            currency,
            destination, // Stripe account or card ID
        });
        res.json({ message: 'Payout initiated', payout });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Create a Stripe Checkout session for subscription
router.post('/create-subscription-session', authenticateJWT, async (req, res) => {
    try {
        const { priceId } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: req.user.email,
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing`,
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe subscription session error:', err);
        res.status(500).json({ error: 'Failed to create subscription session', details: err.message });
    }
});

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Stripe webhook error:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle subscription events here (e.g., update user subscription status)
    res.json({ received: true });
});

module.exports = router;
