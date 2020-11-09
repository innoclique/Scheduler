const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const SunscriptionSchema = new mongoose.Schema({
    orgnizationId:{ type: mongoose.Schema.Types.ObjectId, ref: 'organizations',default:null },
    type:{type:String},
    amount:{type:Number},
    paymentDate:{type:Date,default: Date() },
    nextPaymentDate:{type:Date,default: Date() }
});

SunscriptionSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("subscriptions", SunscriptionSchema);