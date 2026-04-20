// PayPal payment integration (Node.js/Express)
const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');
const { authenticateJWT } = require('../middleware/authenticateJWT');

// PayPal environment setup
const environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Withdraw endpoint
router.post('/api/payments/paypal/withdraw', authenticateJWT, async (req, res) => {
    const { amount, currency, payee_email } = req.body;
    try {
        const request = new paypal.payouts.PayoutsPostRequest();
        request.requestBody({
            sender_batch_header: {
                sender_batch_id: `batch_${Date.now()}`,
                email_subject: 'You have a payout!',
            },
            items: [
                {
                    recipient_type: 'EMAIL',
                    amount: {
                        value: amount,
                        currency,
                    },
                    receiver: payee_email,
                    note: 'Payout from your platform',
                    sender_item_id: `item_${Date.now()}`,
                },
            ],
        });
        const response = await client.execute(request);
        res.json({ message: 'PayPal payout initiated', batch_id: response.result.batch_header.payout_batch_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
