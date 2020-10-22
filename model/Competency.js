const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const ComptetencySchema = new mongoose.Schema({
    Name: { type: String, required: true, unique: true },    
    IsActive:Boolean,
    Questions:[],
    CreatedOn:{type:Date,default: Date() },
    CreatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    UpdatedOn:{type:Date,default: Date() },
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    Company:{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization',default:null }
});

ComptetencySchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("comptetency", ComptetencySchema);