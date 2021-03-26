const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

// "_id" : ObjectId("5fd07b8e5cf6ec62b39038cf"),
// "Status" : "Evaluation Complete",
// "Key" : "EvaluationComplete",
// "Percentage" : 100

const statuses = new mongoose.Schema({
    Status: { type: String},
    Key: { type: String },
    Percentage: { type: Number },
});

statuses.set('toJSON', { versionKey: false });
module.exports = mongoose.model("statuses", statuses);