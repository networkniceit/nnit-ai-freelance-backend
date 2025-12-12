// ...existing code at top...
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE');

// ...existing middleware and routes...

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create checkout session (one-time payment)
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { line_items } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment', // ONE-TIME PAYMENT
            success_url: `http://localhost:${process.env.PORT || 5000}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:${process.env.PORT || 5000}/cancel`,
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create subscription session
app.post('/api/create-subscription-session', async (req, res) => {
    try {
        const { line_items } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'subscription', // RECURRING PAYMENT
            success_url: `http://localhost:${process.env.PORT || 5000}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:${process.env.PORT || 5000}/cancel`,
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Success page
app.get('/success', (req, res) => {
    res.send(`
    <h1>✅ Payment Successful!</h1>
    <p>Session ID: ${req.query.session_id}</p>
    <a href="/">Back to home</a>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
    res.send(`
    <h1>❌ Payment Cancelled</h1>
    <a href="/">Back to home</a>
  `);
});

// ...rest of existing code...