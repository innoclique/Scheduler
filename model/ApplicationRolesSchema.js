const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { date, string } = require("joi");

const ApplicationRolesSchema = new mongoose.Schema({

    ApplicationRoleName: { type: String, required: true },

    CreatedOn: { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn: { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

ApplicationRolesSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("ApplicationRoles", ApplicationRolesSchema);