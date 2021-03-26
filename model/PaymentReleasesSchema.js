const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
var SchemaTypes = mongoose.Schema.Types;
const PaymentReleasesSchema = new mongoose.Schema({

    Organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    ActivationDate: { type: Date },
    UserType: { type: String },
    isAnnualPayment: { type: Boolean},
    NoNeeded: { type: Number, required: true },
    NoOfEmployees: { type: Number, required: true, default:0 },
    NoOfMonths: { type: Number, required: true,default:0},
    NoOfMonthsLable: { type: String, required: true ,default:0},
    Status: { type: String ,default:0},/* Draft,Pending,Success,Complete,Canceled,Rejected */
    COST_PER_MONTH: { type: SchemaTypes.Decimal128,default:0 },
    COST_PER_MONTH_ANNUAL_DISCOUNT : { type: SchemaTypes.Decimal128 },
    COST_PER_PA : { type: SchemaTypes.Decimal128 },
    DISCOUNT_PA_PAYMENT : { type: SchemaTypes.Decimal128 },
    TOTAL_AMOUNT : { type: SchemaTypes.Decimal128 },
    DUE_AMOUNT : { type: SchemaTypes.Decimal128 },
    TAX_AMOUNT : { type: SchemaTypes.Decimal128 },
    TOTAL_PAYABLE_AMOUNT : { type: SchemaTypes.Decimal128 },
    RangeId : { type: mongoose.Schema.Types.ObjectId, ref: 'Overridepricescale', default: null  },
    Range : { type: String},
    DurationMonths : { type: String},
    Purpose : { type: String},
    Type : { type: String},/* Initial,  */
    Paymentdate:{type:Date,default:new Date()},
    ClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
});

PaymentReleasesSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Paymentrelease", PaymentReleasesSchema);