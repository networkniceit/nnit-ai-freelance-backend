// routes/files.js
// File storage/sharing with AWS S3
const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const File = require('../models/File'); // Replace with your File model

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload file to S3
router.post('/api/files/upload', authenticateJWT, upload.single('file'), async (req, res) => {
    const file = req.file;
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${req.user.userId}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const data = await s3.upload(params).promise();
        const fileDoc = new File({
            user_id: req.user.userId,
            url: data.Location,
            key: data.Key,
            originalname: file.originalname,
            uploaded_at: new Date(),
        });
        await fileDoc.save();
        res.status(201).json({ message: 'File uploaded', file: fileDoc });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List user's files
router.get('/api/files', authenticateJWT, async (req, res) => {
    try {
        const files = await File.find({ user_id: req.user.userId });
        res.json({ files });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Download file (presigned URL)
router.get('/api/files/download/:key', authenticateJWT, async (req, res) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: req.params.key,
        Expires: 60 * 5, // 5 minutes
    };
    try {
        const url = s3.getSignedUrl('getObject', params);
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
