'use strict';
const User = require('../models/User');
const Application = require('../models/JobApplication');
const Job = require('../models/Job');
function problem(status,code,message) { return Object.assign(new Error(message),{status,code}); }
function policy(subscription,now=new Date()) {
  const s=subscription||{}, end=new Date(s.currentPeriodEnd).getTime();
  const cancelledAt=s.cancelAt ? new Date(s.cancelAt).getTime() : Infinity;
  const active=['active','trial'].includes(s.status) && !!s.stripeSubscriptionId &&
    Number.isFinite(end) && end>now.getTime() && cancelledAt>now.getTime();
  const plan=active?s.plan:'free';
  return {plan,active,applicationLimit:plan==='starter'?10:plan==='professional'?null:0};
}
function period(now=new Date()) {
  return {start:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)),
    end:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1))};
}
async function usage(user,now=new Date()) {
  const access=policy(user.subscription,now),window=period(now);
  const used=await Application.countDocuments({applicantId:String(user._id),createdAt:{$gte:window.start,$lt:window.end}});
  return {...access,used,remaining:access.applicationLimit===null?null:Math.max(0,access.applicationLimit-used),
    periodStart:window.start,periodEnd:window.end,periodBasis:'UTC calendar month'};
}
async function submit(req,res) {
  const id=String(req.user?._id||'');
  if(!/^[a-f0-9]{24}$/i.test(id))return res.status(401).json({success:false,message:'A verified Freelancer account is required.'});
  if(!/^[a-f0-9]{24}$/i.test(req.params.id||''))return res.status(400).json({success:false,message:'Invalid project ID.'});
  if(User.db.readyState!==1 || Application.db.readyState!==1 || Job.db.readyState!==1)
    return res.status(503).json({success:false,message:'Application database temporarily unavailable.'});
  let session;
  try {
    await Application.init();
    session=await User.db.startSession();
    let application;
    await session.withTransaction(async()=>{
      // A shared account write serializes simultaneous applications and billing changes.
      const user=await User.findOneAndUpdate({_id:id},{$inc:{'subscription.applicationWriteVersion':1}},
        {new:true,session,runValidators:true}).select('subscription').lean();
      if(!user)throw problem(401,'ACCOUNT_NOT_FOUND','Freelancer account not found.');
      const existing=await Application.findOne({jobId:req.params.id,applicantId:id}).session(session).lean();
      if(existing)throw problem(409,'ALREADY_APPLIED','You have already applied to this project.');
      const job=await Job.findById(req.params.id).select('_id status').session(session).lean();
      if(!job)throw problem(404,'PROJECT_NOT_FOUND','Project not found.');
      if(job.status==='closed')throw problem(409,'PROJECT_CLOSED','This project is closed to new applications.');
      const now=new Date(),access=policy(user.subscription,now),window=period(now);
      if(access.applicationLimit===0)throw problem(403,'FREELANCER_PLAN_REQUIRED','An active Freelancer Basic or Pro subscription is required for new marketplace applications. Existing records remain available.');
      const count=await Application.countDocuments({applicantId:id,createdAt:{$gte:window.start,$lt:window.end}}).session(session);
      if(access.applicationLimit!==null && count>=access.applicationLimit)
        throw problem(403,'APPLICATION_LIMIT_REACHED','Your 10 applications for this UTC calendar month are used. Your allowance resets next month.');
      [application]=await Application.create([{jobId:job._id,applicantId:id,status:'pending',createdAt:now}],{session});
    });
    return res.status(201).json({success:true,message:'Application saved.',application:{
      id:application._id,jobId:application.jobId,status:application.status,createdAt:application.createdAt}});
  } catch(error) {
    if(error.code===11000)return res.status(409).json({success:false,code:'ALREADY_APPLIED',message:'You have already applied to this project.'});
    if(error.status)return res.status(error.status).json({success:false,code:error.code,message:error.message});
    return res.status(503).json({success:false,message:'Application was not confirmed saved. Reload My Applications before retrying.'});
  } finally { if(session)await session.endSession(); }
}
module.exports={policy,period,usage,submit};
