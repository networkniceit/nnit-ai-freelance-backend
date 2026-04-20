// middleware/rateLimit.js
// API rate limiting and monitoring dashboard
const rateLimit = require('express-rate-limit');
const RateLimitLog = require('../models/RateLimitLog'); // Replace with your model

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: async (req, res) => {
        // Log the rate limit event
        await RateLimitLog.create({
            ip: req.ip,
            path: req.originalUrl,
            timestamp: new Date(),
        });
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});

module.exports = limiter;
