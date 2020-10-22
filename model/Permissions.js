const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const PermissionsSchema = new mongoose.Schema({

    PermissionCode: { type: String, required: true },
    PermissionName: { type: String, required: true },
    PermissionDescription: { type: String },
    IsActive:{type:Boolean, default:true},
    CreatedOn:  { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    UpdatedOn:  { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

PermissionsSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Permissions", PermissionsSchema);