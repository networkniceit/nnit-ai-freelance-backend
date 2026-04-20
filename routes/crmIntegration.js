// routes/crmIntegration.js
// Integration with external CRMs (example: Salesforce REST API)
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const axios = require('axios');

// Example: Push user info to Salesforce CRM
router.post('/api/crm/salesforce/push-user', authenticateJWT, async (req, res) => {
    const { salesforceAccessToken, salesforceInstanceUrl } = req.body;
    // You would get user info from your DB
    const user = req.user; // For demo, use JWT user info
    try {
        const response = await axios.post(
            `${salesforceInstanceUrl}/services/data/v52.0/sobjects/Contact`,
            {
                LastName: user.full_name || 'Unknown',
                Email: user.email,
            },
            {
                headers: {
                    Authorization: `Bearer ${salesforceAccessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        res.json({ message: 'User pushed to Salesforce', salesforceId: response.data.id });
    } catch (err) {
        res.status(500).json({ error: err.response?.data || err.message });
    }
});

module.exports = router;
