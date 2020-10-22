const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { date, string } = require("joi");
//const { boolean } = require("joi");

const AccomplishmentsSchema = new mongoose.Schema({

    Accomplishment: { type: String, required: true },
    CompletionDate: { type: Date, required: true, unique: true },
    Comments: { type: String },
    ShowToManager: { type: Boolean },
    Employee:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    CreatedOn:  { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    UpdatedOn:  { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

AccomplishmentsSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Accomplishments", AccomplishmentsSchema);