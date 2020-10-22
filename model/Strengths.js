const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
//const { boolean } = require("joi");

const StrengthSchema = new mongoose.Schema({

    Strength: { type: String, required: true },
    Leverage: { type: String, required: true, unique: true },
    TeamBenifit: { type: String },
    SelfBenifit: { type: String },
    Status:{type:String},
    Comments:{type:String},
    Employee:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

StrengthSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Strength", StrengthSchema);