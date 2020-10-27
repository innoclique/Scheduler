const Express = require("express");
//require('dotenv').config();
const mongoose = require("mongoose");


const DeliverEmailSchema = new mongoose.Schema({
    User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    Type: { type: String },
    IsDelivered: Boolean,
    Template: { type: String },
    Subject:{type:String},    
    Email:{type:String},
    Company: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    CreatedOn: { type: Date, default: Date() },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    UpdatedOn: { type: Date, default: Date() },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    Model:{ type: String },
    Queue:{ type: String }
});

DeliverEmailSchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("DeliverEmail", DeliverEmailSchema);