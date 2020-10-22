const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const MeasurementCriteria = new mongoose.Schema({

    Name: { type: String, required: true },

    CreatedOn: { type: Date,default:Date() },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn: { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

MeasurementCriteria.set('toJSON', { versionKey: false });

module.exports = mongoose.model("MeasurementCriterias", MeasurementCriteria);