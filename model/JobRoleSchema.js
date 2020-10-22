const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { date, string } = require("joi");

const JobRoleSchema = new mongoose.Schema({

    JobRoleName: { type: String, required: true },

    CreatedOn: { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn: { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

JobRoleSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("JobRoles", JobRoleSchema);