'use strict';
const Stripe=require('stripe');
const User=require('../models/User');
const Receipt=require('../models/NNITBillingEvent');
const stripe=process.env.STRIPE_SECRET_KEY?Stripe(process.env.STRIPE_SECRET_KEY):null;
const plans=()=>[
 {key:'basic',plan:'starter',label:'Freelancer Basic',priceId:process.env.STRIPE_FREELANCER_BASIC||'price_1TPSy8GaTGR0sWqWySbqscVg'},
 {key:'pro',plan:'professional',label:'Freelancer Pro',priceId:process.env.STRIPE_FREELANCER_PRO||'price_1TPSzAGaTGR0sWqWfdiGuXje'},
 {key:'client',plan:'enterprise',label:'Client Premium',priceId:process.env.STRIPE_CLIENT_PREMIUM||'price_1TPT00GaTGR0sWqWDvavXJXN'}
];
const identity=x=>typeof x==='string'?x:x?.id;
const accountId=req=>String(req.user?._id||req.user?.id||'');
const idOK=x=>typeof x==='string'&&/^[a-f0-9]{24}$/i.test(x);
function origin(){const u=new URL(process.env.FRONTEND_URL||'https://nnit-enterprise.vercel.app');if(u.protocol!=='https:' && !(['localhost','127.0.0.1'].includes(u.hostname)&&u.protocol==='http:'))throw Error('Invalid frontend origin');if(u.username||u.password)throw Error('Invalid frontend origin');return u.origin;}
const fail=(res,status,message)=>res.status(status).json({success:false,error:message});
async function checkout(req,res){
 if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET)return fail(res,503,'Subscription checkout needs Stripe and its webhook configured.');
 const plan=plans().find(p=>p.priceId===req.body?.priceId||p.key===req.body?.plan);
 if(!plan||!/^price_[a-zA-Z0-9]+$/.test(plan.priceId))return fail(res,400,'Choose an existing NNIT subscription plan.');
 try{
  const id=accountId(req);if(!idOK(id))return fail(res,401,'Sign in to your Freelancer account.');
  const user=await User.findById(id).select('email subscription').lean();
  if(!user)return fail(res,401,'Account not found.');
  if(user.subscription?.stripeSubscriptionId && ['active','trial'].includes(user.subscription.status))return fail(res,409,'A subscription already exists. Use billing management.');
  const price=await stripe.prices.retrieve(plan.priceId);
  if(!price.active||price.type!=='recurring')return fail(res,503,'This subscription price is unavailable.');
  let customer=user.subscription?.stripeCustomerId;
  if(!customer){
   const created=await stripe.customers.create({email:user.email,metadata:{nnitUserId:id}},{idempotencyKey:'nnit-customer-'+id});
   const linked=await User.findOneAndUpdate({_id:id,$or:[{'subscription.stripeCustomerId':{$exists:false}},{'subscription.stripeCustomerId':null},{'subscription.stripeCustomerId':''}]},{$set:{'subscription.stripeCustomerId':created.id}},{new:true}).select('subscription').lean();
   customer=linked?.subscription?.stripeCustomerId||(await User.findById(id).select('subscription').lean())?.subscription?.stripeCustomerId;
   if(!customer)throw Error('Customer not saved');
  }
  const subscriptions=await stripe.subscriptions.list({customer,status:'all',limit:100});
  if(subscriptions.data.some(s=>!['canceled','incomplete_expired'].includes(s.status)))return fail(res,409,'A subscription already exists. Use billing management.');
  const base=origin();
  const session=await stripe.checkout.sessions.create({mode:'subscription',customer,client_reference_id:id,
   line_items:[{price:plan.priceId,quantity:1}],metadata:{nnitUserId:id,nnitPlan:plan.key},
   subscription_data:{metadata:{nnitUserId:id,nnitPlan:plan.key}},
   success_url:base+'/freelancer?billing=return',cancel_url:base+'/freelancer?billing=cancelled'
  },{idempotencyKey:'nnit-checkout-'+id+'-'+plan.key+'-'+Math.floor(Date.now()/600000)});
  if(!session.url)throw Error('No checkout URL');res.json({success:true,url:session.url});
 }catch(e){return fail(res,503,'Checkout could not be prepared. No payment was confirmed.');}
}
async function status(req,res){try{const user=await User.findById(accountId(req)).select('subscription').lean();if(!user)return fail(res,401,'Account not found.');res.set('Cache-Control','no-store');res.json({success:true,subscription:user.subscription||{plan:'free',status:'inactive'}});}catch{return fail(res,503,'Saved billing status unavailable.');}}
async function portal(req,res){if(!stripe)return fail(res,503,'Stripe is not configured.');try{const user=await User.findById(accountId(req)).select('subscription').lean();const customer=user?.subscription?.stripeCustomerId;if(!customer)return fail(res,409,'No linked Stripe customer.');const session=await stripe.billingPortal.sessions.create({customer,return_url:origin()+'/freelancer'});res.json({success:true,url:session.url});}catch{return fail(res,503,'Billing management unavailable.');}}
async function webhook(req,res){
 if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET)return fail(res,503,'Webhook not configured.');
 if(!Buffer.isBuffer(req.body))return fail(res,400,'Raw webhook body required.');
 let event;try{event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return fail(res,400,'Invalid webhook signature.');}
 const types=['checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'];
 if(!types.includes(event.type))return res.json({received:true,ignored:true});
 try{
  if(!event.id||!Number.isSafeInteger(event.created))throw Error('Invalid event');
  await Receipt.init();
  if(await Receipt.findOne({eventId:event.id}).lean())return res.json({received:true,duplicate:true});
  const object=event.data.object;
  const subId=event.type==='checkout.session.completed'?identity(object.subscription):object.id;
  if(!subId)return res.json({received:true,ignored:true});
  const sub=await stripe.subscriptions.retrieve(subId);
  const customer=identity(sub.customer);
  let user;
  if(idOK(sub.metadata?.nnitUserId))user=await User.findOne({_id:sub.metadata.nnitUserId,'subscription.stripeCustomerId':customer}).select('subscription').lean();
  else user=await User.findOne({'subscription.stripeCustomerId':customer,'subscription.stripeSubscriptionId':sub.id}).select('subscription').lean();
  if(!user)return res.json({received:true,ignored:true});
  // Do not let an old subscription replace a different linked subscription.
  if(user.subscription?.stripeSubscriptionId && user.subscription.stripeSubscriptionId!==sub.id){
   const previous=await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);
   if(!['canceled','incomplete_expired'].includes(previous.status)||sub.metadata?.nnitUserId!==String(user._id))return res.json({received:true,ignored:true});
  }
  const items=sub.items?.data||[],plan=plans().find(p=>items.some(i=>identity(i.price)===p.priceId));
  const active=sub.status==='active'||sub.status==='trialing';
  if(active&&(!plan||items.length!==1))throw Error('Unmapped subscription price');
  const ends=items.map(i=>i.current_period_end).filter(Number.isFinite);
  const end=Number.isFinite(sub.current_period_end)?sub.current_period_end:ends.length?Math.max(...ends):null;
  const update={'subscription.plan':active?plan.plan:'free','subscription.status':sub.status==='trialing'?'trial':active?'active':sub.status==='canceled'?'cancelled':'inactive',
   'subscription.stripeCustomerId':customer,'subscription.stripeSubscriptionId':sub.id,'subscription.currentPeriodEnd':end?new Date(end*1000):null,
   'subscription.lastStripeEventCreated':event.created,'subscription.lastStripeEventId':event.id};
  const saved=await User.updateOne({_id:user._id,'subscription.stripeCustomerId':customer,...(user.subscription?.stripeSubscriptionId?{'subscription.stripeSubscriptionId':user.subscription.stripeSubscriptionId}:{}),
   $or:[{'subscription.lastStripeEventCreated':{$exists:false}},{'subscription.lastStripeEventCreated':{$lte:event.created}}]},{$set:update},{runValidators:true});
  if(saved.matchedCount!==1 && (user.subscription?.lastStripeEventCreated||0)<=event.created)throw Error('Account changed during subscription update');
  await Receipt.updateOne({eventId:event.id},{$setOnInsert:{eventId:event.id,type:event.type,created:event.created}},{upsert:true});
  return res.json({received:true});
 }catch{return fail(res,503,'Subscription update not confirmed. Stripe can retry this event.');}
}
module.exports={checkout,status,portal,webhook,plans};
