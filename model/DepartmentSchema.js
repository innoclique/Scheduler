const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { date, string } = require("joi");

const DepartmentSchema = new mongoose.Schema({

    DepartmentName: { type: String, required: true },

    CreatedOn: { type: Date },
    CreatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    UpdatedOn: { type: Date },
    UpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

DepartmentSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Departments", DepartmentSchema);