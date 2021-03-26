const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    Organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organizations', default: null },
    ActivatedOn: { type: Date },
    ValidTill: { type: Date },
});

subscriptionSchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("subscriptions", subscriptionSchema);