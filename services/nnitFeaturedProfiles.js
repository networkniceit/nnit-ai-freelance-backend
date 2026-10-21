'use strict';
const Profile = require('../models/MarketplaceProfile');
const User = require('../models/User');
function pipeline(now=new Date(),users=User.collection.name) {
  return [
    {$match:{available:true}},
    {$lookup:{from:users,let:{profileOwner:'$userId'},pipeline:[
      {$match:{$expr:{$eq:[{$toString:'$_id'},'$$profileOwner']}}},
      {$project:{_id:0,subscription:1}}
    ],as:'__billing'}},
    {$set:{featured:{$let:{vars:{billing:{$arrayElemAt:['$__billing',0]}},in:{$and:[
      {$eq:['$$billing.subscription.plan','professional']},
      {$in:['$$billing.subscription.status',['active','trial']]},
      {$eq:[{$type:'$$billing.subscription.stripeSubscriptionId'},'string']},
      {$ne:['$$billing.subscription.stripeSubscriptionId','']},
      {$gt:['$$billing.subscription.currentPeriodEnd',now]},
      {$or:[{$eq:[{$ifNull:['$$billing.subscription.cancelAt',null]},null]},
        {$gt:['$$billing.subscription.cancelAt',now]}]}
    ]}}}}},
    {$project:{_id:1,name:1,skills:1,hourlyRate:1,bio:1,experience:1,available:1,updatedAt:1,featured:1}},
    {$sort:{featured:-1,updatedAt:-1,_id:-1}},
    {$limit:100}
  ];
}
async function list(){ return Profile.aggregate(pipeline()); }
module.exports={pipeline,list};
