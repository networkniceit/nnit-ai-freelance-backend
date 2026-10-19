'use strict';
const mongoose=require('mongoose');
const schema=new mongoose.Schema({eventId:{type:String,required:true,unique:true},type:String,created:Number},{timestamps:true});
module.exports=mongoose.models.NNITBillingEvent||mongoose.model('NNITBillingEvent',schema);
