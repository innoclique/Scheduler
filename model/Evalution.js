const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");


const Evalution = new mongoose.Schema({
    Employees:[{
        _id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
        Peers:[],
        PeersCompetencyMessage:{type:String,default:""},
        PeersCompetencyList:[],
        DirectReportees:[],
        DirectReporteeComptencyMessage:{type:String,default:""},
        DirectReporteeCompetencyList:[],
        Model:{ type: mongoose.Schema.Types.ObjectId, ref: 'models',default:null }
    }
],
    ActivateKPI:Boolean,
    ActivateActionPlan:Boolean,
    EvaluationForRole:String,
    EvaluationPeriod:String,
    EvaluationDuration:String,
    CreatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    CreatedDate:{type:Date,default:Date()},
    UpdatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',default:null },
    UpdatedDate:{type:Date,default:Date()},
    Company:{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization',default:null },
    // tracks: [{
    //     user: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'User',
    //         default:null
    //     },
    //     action: {
    //         type: String,
    //         enum: ['APPROVE', 'REJECT', 'CREATE', 'FORWARD'],
    //         default: 'NEW'
    //     },
    //     comment: String,
    //     created_at: {
    //         type: Date,
    //         default: Date.now
    //     },
    //     updated_at: {
    //         type: Date,
    //         default: Date.now
    //     }
    // }],
KPIFor:String,
Department:String,
IsDraft:{type:Boolean,default:false}
    
    
});

Evalution.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Evalution", Evalution);