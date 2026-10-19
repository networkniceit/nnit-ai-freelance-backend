'use strict';
const router = require('express').Router();
const {protect} = require('../middleware/auth');
const Application = require('../models/JobApplication');
const Job = require('../models/Job');
const Delivery = require('../models/NNITDelivery');
const idOK = x => typeof x==='string' && /^[a-f0-9]{24}$/i.test(x);
const run = fn => async(req,res) => {
  try {
    if (Job.db.readyState!==1) return res.status(503).json({success:false,message:'Marketplace database unavailable.'});
    return await fn(req,res);
  } catch(e) {
    return res.status(e.code===11000?409:503).json({success:false,message:e.code===11000?'Delivery changed. Reload before saving.':'Delivery could not be confirmed. Reload before retrying.'});
  }
};
async function access(req,res) {
  if(!idOK(req.params.applicationId)){res.status(400).json({success:false,message:'Invalid application ID.'});return null;}
  const application=await Application.findById(req.params.applicationId).lean();
  const project=application && await Job.findById(application.jobId).select('_id userId title').lean();
  const actor=String(req.user._id || req.user.id);
  if(!application || !project || ![String(application.applicantId),String(project.userId)].includes(actor)){
    res.status(404).json({success:false,message:'Application not found.'});return null;
  }
  if(application.status!=='accepted'){res.status(409).json({success:false,message:'Delivery is available for accepted applications.'});return null;}
  return {application,project,actor,isApplicant:actor===String(application.applicantId),isOwner:actor===String(project.userId)};
}
function result(a,delivery){return {success:true,delivery,canSubmit:a.isApplicant,canReview:a.isOwner};}
router.use(protect);
router.get('/deliveries/:applicationId',run(async(req,res)=>{
  const a=await access(req,res);if(!a)return;
  const delivery=await Delivery.findOne({applicationId:a.application._id}).lean();
  res.set('Cache-Control','no-store');res.json(result(a,delivery));
}));
router.post('/deliveries/:applicationId',run(async(req,res)=>{
  const a=await access(req,res);if(!a)return;
  const b=req.body || {};
  if(Object.keys(b).some(k=>!['status','version','notes','url'].includes(k)) ||
    !['submitted','revision_requested','completed'].includes(b.status) || !Number.isSafeInteger(b.version) || b.version<0 ||
    typeof b.notes!=='string' || !b.notes.trim() || b.notes.length>5000 || typeof b.url!=='string' || b.url.length>2000){
    return res.status(400).json({success:false,message:'Provide delivery notes and a valid saved version.'});
  }
  let url=b.url.trim();
  if(url){try{const u=new URL(url);if(u.protocol!=='https:' || u.username || u.password)throw Error();url=u.href;}catch{return res.status(400).json({success:false,message:'Use an HTTPS delivery link without credentials.'});}}
  const submitting=b.status==='submitted';
  if((submitting&&!a.isApplicant)||(!submitting&&!a.isOwner))return res.status(403).json({success:false,message:'This account cannot perform that delivery action.'});
  await Delivery.init();
  const current=await Delivery.findOne({applicationId:a.application._id}).lean();
  if((current?.version || 0)!==b.version)return res.status(409).json({success:false,message:'Delivery changed. Reload before saving.'});
  if(submitting && current && current.status!=='revision_requested')return res.status(409).json({success:false,message:'Delivery is already submitted or completed.'});
  if(!submitting && current?.status!=='submitted')return res.status(409).json({success:false,message:'Only a submitted delivery can be reviewed.'});
  const at=new Date(),notes=b.notes.trim();
  const event={status:b.status,actorId:a.actor,notes,url:submitting?url:'',at};
  const changes={status:b.status,...(submitting?{notes,url,feedback:''}:{feedback:notes}),version:b.version+1};
  let delivery;
  if(!current){delivery=await Delivery.create({applicationId:a.application._id,jobId:a.project._id,...changes,history:[event]});delivery=delivery.toObject();}
  else delivery=await Delivery.findOneAndUpdate({_id:current._id,version:b.version,status:current.status},
    {$set:changes,$push:{history:{$each:[event],$slice:-50}}},{new:true,runValidators:true}).lean();
  if(!delivery)return res.status(409).json({success:false,message:'Delivery changed. Reload before saving.'});
  res.json(result(a,delivery));
}));
module.exports=router;
