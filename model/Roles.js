const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const RolesSchema = new mongoose.Schema({

    RoleCode: { type: String, required: true },
    RoleName: { type: String, required: true },
    RoleLevel: { type: String },   
    IsActive:{type:Boolean, default:true}, 
    Permissions:[{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permissions' }],
        NavigationMenu:[],
    CreatedOn:  { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn:  { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

RolesSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Roles", RolesSchema);