const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const QuestionSchema = new mongoose.Schema({
    Name: { type: String, required: true, unique: true },    
    IsActive:Boolean,
    CreatedOn:{type:Date,default: Date() },
    CreatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    UpdatedOn:{type:Date,default: Date() },
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null } 
    
});

QuestionSchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("questions", QuestionSchema);