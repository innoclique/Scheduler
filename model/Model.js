const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const ModelSchema = new mongoose.Schema({
    Name: { type: String, required: true, unique: true },
    Industry :[],
    JobRole:[],
    JobLevel:[],
    IsActive:Boolean,
    CreatedOn:{type:Date,default: Date() },
    CreatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    UpdatedOn:{type:Date,default: Date() },
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },    
    IsDraft:Boolean
});

ModelSchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("models", ModelSchema);