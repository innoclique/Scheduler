const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { date, string } = require("joi");

const JobLevelSchema = new mongoose.Schema({

    JobLevelName: { type: String, required: true },

    CreatedOn: { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn: { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

JobLevelSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("JobLevels", JobLevelSchema);