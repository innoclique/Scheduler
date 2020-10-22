const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

//const { boolean } = require("joi");

const NotesSchema = new mongoose.Schema({

    Discussedwith: { type: String, required: true },
    Notes: { type: Date(), required: true },
    Comments: { type: String },
    user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    CreatedOn:  { type: Date() },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    UpdatedOn:  { type: Date() },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

NotesSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Notes", NotesSchema);