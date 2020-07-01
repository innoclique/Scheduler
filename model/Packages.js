var mongoose = require('mongoose');
var packagesFlowSchema = new mongoose.Schema({
    title: String,
    subtitle: String,
    isFree: {
        type: Boolean,
        default: false
    },
    active: {
        type: String,
        default: false
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    // image : {type: String, default:"https://www.graduiertenzentrum.uni-kiel.de/de/pics/prof-wilhelm-hasselbring/image_w480"},
    status: String,
    price: Number,
    expireat:Date,
    payinterval:String,
    modeOfPay:String,
    maxprojects:Number,
    maxusers:Number,
    maxstorage:Number,
    attributes: {}
}, {
    usePushEach: true
});

mongoose.model('Packages', packagesFlowSchema);