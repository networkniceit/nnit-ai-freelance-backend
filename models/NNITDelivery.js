'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  applicationId: {type: mongoose.Schema.Types.ObjectId, ref:'JobApplication', required:true, unique:true},
  jobId: {type: mongoose.Schema.Types.ObjectId, ref:'Job', required:true},
  status: {type:String, enum:['submitted','revision_requested','completed'], required:true},
  notes: {type:String, maxlength:5000, default:''},
  url: {type:String, maxlength:2000, default:''},
  feedback: {type:String, maxlength:5000, default:''},
  version: {type:Number, required:true, min:1},
  history: [{_id:false, status:String, actorId:String, notes:String, url:String, at:Date}]
}, {timestamps:true});
module.exports = mongoose.models.NNITDelivery || mongoose.model('NNITDelivery',schema);
