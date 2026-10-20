'use strict';
// NNIT_ACCOUNT_LINK_V1: proof of both accounts; no email-based merges.
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const schema = new mongoose.Schema({
  enterpriseId: { type: String, required: true, unique: true },
  freelancerId: { type: String, required: true, unique: true }
}, { timestamps: true });
const Link = mongoose.models.NNITAccountLink || mongoose.model('NNITAccountLink', schema);
const router = express.Router();
router.use((req,res,next) => { res.set('Cache-Control','no-store'); next(); });
router.use(rateLimit({ windowMs: 60000, limit: 12, standardHeaders: true, legacyHeaders: false }));
async function enterpriseIdentity(token) {
  if (typeof token !== 'string' || token.length > 16384) throw Object.assign(new Error('Valid Enterprise session required.'), { status: 401 });
  const decoded = jwt.decode(token, { complete: true });
  const p = decoded?.payload;
  const id = p && (p.id || p.sub);
  if (decoded?.header?.alg !== 'HS256' || !p || typeof p !== 'object' ||
      !(typeof id === 'string' && id.length > 0 && id.length < 200 || Number.isSafeInteger(id)) ||
      !Number.isFinite(p.exp) || p.exp * 1000 <= Date.now()) {
    throw Object.assign(new Error('Enterprise session expired or invalid. Sign in to Enterprise again.'), { status: 401 });
  }
  let response;
  try {
    response = await fetch('https://nnit-enterprise-production.up.railway.app/api/auth/session', {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(10000)
    });
  } catch { throw Object.assign(new Error('Enterprise verification unavailable. Your existing login still works.'), { status: 503 }); }
  if ([401,403].includes(response.status)) throw Object.assign(new Error('Enterprise rejected this session. Sign in to Enterprise again.'), { status: 401 });
  if (response.status !== 200) throw Object.assign(new Error('Enterprise verification unavailable.'), { status: 503 });
  const body = await response.json();
  if (body.success !== true || !body.user || String(body.user.id) !== String(id)) throw Object.assign(new Error('Unexpected Enterprise verification response.'), { status: 503 });
  // Claims become trusted only after the fixed Enterprise server accepts this exact token.
  return String(id);
}
function failure(res,error) {
  const status = error.code === 11000 ? 409 : error.status || 503;
  return res.status(status).json({ success:false, message: status === 409 ? 'An account is already linked. Existing links were kept.' : error.status ? error.message : 'Account linking unavailable. Existing accounts were kept.' });
}
router.post('/link', protect, async (req,res) => {
  try {
    if (Link.db.readyState !== 1) throw Object.assign(new Error('Account database unavailable.'), {status:503});
    const enterpriseId = await enterpriseIdentity(req.body?.enterpriseToken);
    const freelancerId = String(req.user._id);
    await Link.init();
    const existing = await Link.findOne({ enterpriseId }).lean();
    if (existing && existing.freelancerId === freelancerId) return res.json({success:true});
    if (existing) return res.status(409).json({success:false,message:'This Enterprise account is already linked to another Freelancer account.'});
    await Link.create({ enterpriseId, freelancerId });
    return res.json({ success:true });
  } catch(error) { return failure(res,error); }
});
router.post('/session', async (req,res) => {
  try {
    if (Link.db.readyState !== 1) throw Object.assign(new Error('Account database unavailable.'), {status:503});
    const enterpriseId = await enterpriseIdentity(req.body?.enterpriseToken);
    const link = await Link.findOne({ enterpriseId }).lean();
    if (!link) return res.status(409).json({success:false,code:'LINK_REQUIRED',message:'Sign in to your existing Freelancer account, then confirm the account link.'});
    const user = await User.findById(link.freelancerId).select('_id');
    if (!user) return res.status(401).json({success:false,message:'Linked Freelancer account unavailable.'});
    const decoded = jwt.decode(req.body.enterpriseToken);
    const seconds = Math.min(1800, Math.floor(decoded.exp - Date.now()/1000));
    if (seconds < 1) return res.status(401).json({success:false,message:'Enterprise session expired.'});
    const token = jwt.sign({id:String(user._id)},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:seconds});
    return res.json({success:true,token});
  } catch(error) { return failure(res,error); }
});
module.exports = router;
