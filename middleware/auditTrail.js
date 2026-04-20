// middleware/auditTrail.js
// Audit trail with field-level change history
const AuditLog = require('../models/AuditLog'); // Replace with your model

async function logAudit({ userId, action, collection, documentId, before, after }) {
    await AuditLog.create({
        user_id: userId,
        action,
        collection,
        document_id: documentId,
        before,
        after,
        timestamp: new Date(),
    });
}

module.exports = logAudit;
