const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const OrganizationSchema = new mongoose.Schema({
    Name: { type: String, required: true, unique: true },
    Industry :{ type: String, required: true },
    Email: { type: String, required: true },
    Phone: { type: String, required: true },
    PhoneExt:{ type: String},
    Address:{ type: String, required: true },
    State:{ type: String, required: true },
    City:{ type: String, required: true },
    Country:{ type: String, required: true },
    ZipCode:{ type: String, required: true  },
    UsageType:{ type: String },
    IsActive:{ type: Boolean, required: true },    
    ClientType:{ type: String, required: true },
    UsageCount:{ type: String},
    ContactPersonEmail:{ type: String, required: true },
    ContactPersonFirstName:{ type: String, required: true },
    ContactPersonLastName:{ type: String, required: true },
    ContactPersonMiddleName:{ type: String },
    ContactPersonPhone:{ type: String, required: true },
    SameAsAdmin:{ type: Boolean, required: true },
    Admin:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    AdminEmail:{ type: String, required: true },
    AdminFirstName:{ type: String, required: true },
    AdminMiddleName:{ type: String },
    AdminLastName:{ type: String, required: true },
    AdminPhone:{ type: String, required: true },
    CoachingReminder:{ type: String },
    EvaluationModels:[],
    EvaluationPeriod:{ type: String },
    EvaluationDuration:{ type: String, default:'12 Months' },
    
    EmployeeBufferCount:{ type: String},
    DownloadBufferDays:{ type: String},
    CreatedOn:{type:Date,default: Date() },
    CreatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    UpdatedOn:{type:Date,default: Date() },
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    StartMonth:{type:String},
    EndMonth:{type:String},
    IsDraft:Boolean
});

OrganizationSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Organization", OrganizationSchema);