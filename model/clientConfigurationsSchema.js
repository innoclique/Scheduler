require('dotenv').config();
const mongoose = require("mongoose");

// "ConfigKey" : "PG-SIGNOFF",
// "ActivateWithin" : 250,
// "onBeforeAfter" : "After",
// "RefferenceTo" : "Evaluation-start-date",
// "TimeUnit" : "DAYS",

const clientConfigurationsSchema = new mongoose.Schema({
    Organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    ConfigKey:{type:String},
    TimeUnit:{type:String},
    ActivateWithin:{type:Number},
    onBeforeAfter:{type:String},
    RefferenceTo:{type:String},
});

clientConfigurationsSchema.set('toJSON', { versionKey: false });
module.exports = mongoose.model("clientconfigurations", clientConfigurationsSchema);