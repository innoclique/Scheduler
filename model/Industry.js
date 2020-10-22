const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const Industries = new mongoose.Schema({
    Code:{ type: String, required: true, unique: true },
    Name:{ type: String, required: true, unique: true },
    IsActive:{ type: Boolean,default:true },
    Department:[
        {
        DeptName: {type: String, required: true},
        JobRoles:[ ]
       }

    ],


    CreatedOn:{type:Date,default:new Date()},
    CreateBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    UpdatedOn:{type:Date,default:new Date()},
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

Industries.set('toJSON', { versionKey: false });

module.exports = mongoose.model("industries", Industries);