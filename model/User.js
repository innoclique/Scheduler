var mongoose = require('mongoose');


var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true
    },
    isVerifiedByAdmin: {
        type: Boolean,
        default: false
    },
    password:{
        select: false,
        type:String
    },
    username: String,
    last_name: String,    
    secondaryRole: String,
    sendmail: String,
    details: String,
    address: String,
    validity: Boolean,
    emp_impersonate_code: String,
    emp_impersonate_time: Date,
    secondRole: String,
    company_logo: String,
    comp_profile: String,
    company_name: String,
    location: String,
    website: String,
    storage_used: String,
    phone_no: Number,
    licence_grade: String,
    licence_activity_code: String,
    trade_activity_code: [],
    trade_license_photos: [],
    NavMenu:[],
    subscription_id:String,
    code: String,
    impersonate_code: String,
    impersonate_time: Date,
    country: String,
    language: String,
    associates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    date_of_birth: String,
    hire_Date: String,
    parentUser_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    role: String,
    company_stamp: String,
    signature: String,
    image: String,
    account_id: String,
    card_type: String,
    upload_limit: String,
    download_limit: String,
    company_url: String,
    designation: String,
    expiry_date: {
        type: Date,
        default: Date.now
    },
    subcription_date: {
        type: Date,
        default: Date.now
    },
    contact_verify: {
        type: Boolean,
        default: false
    },
    contact_otp: String,
    systemPermissions: [],
    admin_system_permissions: [],
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    active: {
        type: Boolean,
        default: true
    },
    isverify: {
        type: Boolean,
        default: false
    },
    next_billing_date: {
        type: Date,
        default: Date.now
    },
    CreatedTime: {
        type: Date,
        default: Date.now
    },
    UpdatedTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        ref: 'Active'
    },
    packageId: {        
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Packages'
    },
    isInvitedByOtherUser: {
        type: Boolean,
        default: false
    },
    
    pwdchangeonfirstlogin:String,
    isTrail:Boolean,
    trailDays:String
    
}, {
    usePushEach: true
});

mongoose.model('User', UserSchema,'users');