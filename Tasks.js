//var UserManager = require("./Repos/UserManager.js");
var mongoose = require("mongoose");
require('./model/User')
require('./model/Packages')
const Mongoose = require("mongoose");
var fs = require("fs");
const EvaluationRepo = require('./model/Evalution');
const DeliverEmailRepo = require('./model/DeliverEmail');
const UserRepo = require('./model/UserSchema');
const OrganizationRepo = require('./model/OrganizationSchema');
const subscriptionSchema = require('./model/Subscriptions');
const moment = require('moment');

var SendMail = require("./helpers/mail.js");
var env = process.env.NODE_ENV || 'dev';
var config = require('./config/' + env + '.config');

var task = function () {

}
task.GetUserCount = async function () {
    var User = mongoose.model("User");
    return await User.find({}).count();
}
task.GetAboutToExpireUsers = async function () {
    var package = mongoose.model("Packages");
    var date = new Date();
    var last3Days = date.setDate(date.getDate() + 3)
    return await package.find({ expireat: last3Days });
}
task.GetPackageExpiredUsers = async function () {
    var package = mongoose.model("Packages");
    var User = mongoose.model("User");
    var date = new Date();
    var last3Days = date.setDate(date.getDate() + 3)
    var expiredList = await package.find(({ expireat: { $lte: new Date() } }));
    var usersList = [];

    // console.log('element',element)
    for (let index = 0; index < expiredList.length; index++) {
        const element = expiredList[index];
        var user = await User.findOne({ 'packageId': mongoose.Types.ObjectId(element._id) });
        if (user) {
            console.log('user', user.email)
            usersList.push(user);
            // var mailObject = SendMail.GetMailObject(
            //     user.email,
            //     "Account Expired",
            //     "Your account will expire Soon",
            //     null,
            //     null
            // );
            // SendMail.sendEmail(mailObject, function (res) {
            //     console.log(res);
            // });
        }


    }
    return usersList;



}
task.NotifyEvaluationToEmployees = async () => {
    console.log('came into email send functionality')
    var list = await DeliverEmailRepo.find({ IsDelivered: false, Email: { $ne: null } })
        .populate('User._id')
        .sort({ CreatedOn: -1 })
    console.log('count', list.length)
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
        const _user = await UserRepo.findOne({ _id: mongoose.Types.ObjectId(element.User) })
        // var generatedlink =
        //         config.APP_BASE_URL + "auth/VerifiedEmail/" + Linkresult._id.toString();
        fs.readFile(__dirname + "/EmailTemplates/EvaluationForEmployee.html", function read(
            err,
            bufcontent
        ) {
            var content = bufcontent.toString();
            content = content.replace("##FirstName##", _user.FirstName);
            content = content.replace("##ProductName##", config.ProductName);

            var mailObject = SendMail.GetMailObject(
                element.Email,
                element.Subject,
                content,
                null, null
            );
            // console.log('mail',mailObject);
            SendMail.sendEmail(mailObject, async function (res) {
                console.log(res);
                await DeliverEmailRepo.update({ _id: element._id }, { IsDelivered: true })
            });

        });

    }
}
task.NotifyToCSAOnLicenseExpiry = async () => {

    console.log('came into NotifyToCSAOnLicenseExpiry functionality')
    //var list = await OrganizationRepo.aggregate([{ $project: { _id: 1, dateDifference: { $subtract: ["$$NOW", "$CreatedOn"] } } }]);
    // .populate('Admin._id')
    // .sort({ CreatedOn: -1 })
    // var ff=new OrganizationRepo({"EvaluationModels" : [ 
    //     "Model 1"
    // ],
    // "EvaluationDuration" : "12 Months",
    // "CreatedOn" : new Date(),
    // "CreatedBy" : "5f3b917267a8120120fbb0d6",
    // "UpdatedOn" : new Date(),
    // "UpdatedBy" : "5f3b917267a8120120fbb0d6",
    // "IsDraft" : false,
    // "Name" : "Client IO",
    // "Industry" : "IT",
    // "Address" : "address 1",
    // "Phone" : "878687676767",
    // "PhoneExt" : "78",
    // "Email" : "qw90@90.90",
    // "Country" : "India",
    // "State" : "Bihar",
    // "City" : "Arrah",
    // "ZipCode" : "98879",
    // "ClientType" : "Client",
    // "UsageType" : "Employees",
    // "UsageCount" : "7",
    // "AdminFirstName" : "admin",
    // "AdminLastName" : "uiyiuyuiyi",
    // "AdminMiddleName" : "iuhui",
    // "AdminEmail" : "jjjj@jjj.ll",
    // "AdminPhone" : "987987987897",
    // "SameAsAdmin" : true,
    // "CoachingReminder" : "60",
    // "EvaluationPeriod" : "CalendarYear",
    // "EmployeeBufferCount" : "35",
    // "DownloadBufferDays" : "10",
    // "IsActive" : true,
    // "StartMonth" : "1",
    // "EndMonth" : "December",
    // "ContactPersonFirstName" : "uiyiuyuiyi",
    // "ContactPersonMiddleName" : "iuhui",
    // "ContactPersonLastName" : "uiyiuyuiyi",
    // "ContactPersonPhone" : "987987987897",
    // "ContactPersonEmail" : "jjjj@jjj.ll",
    // "Admin" : "5f770ab29345953610f0dae5",
    // "__v" : 0})
    // await ff.save();
    
    const count1=await OrganizationRepo.countDocuments();
    console.log('count',count1)
    var list = await OrganizationRepo.aggregate(
        [
            { $match: { ClientType: 'Client' } },
        {
            $project:
            {
                _id: 1,
                Admin:1,
                dayssince:
                {
                    $trunc:
                    {
                        $divide:
                            [
                                {
                                    $subtract:
                                        ["$$NOW", "$CreatedOn"]

                                }, 1000 * 60 * 60 * 24
                            ]
                    }
                }
            }
        }
        // ,{
        //     $lookup: {
        //         from: "users",
        //         localField: "Admin",
        //         foreignField: "_id",
        //         as: "Admin"
        //     }
        // },
        //  {
        //     "$unwind": "$Admin"
        //   }
         
        ]
    )
    console.log('count', { list })
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
        console.log('element',element)
        var iteration=1;
        var sendEmail=false;
        if(element.dayssince>=15 && element.dayssince<=31){
iteration=1;
        }
        else if(element.dayssince>=7 && element.dayssince<=14){
            iteration=2;
        }
        
        else if(element.dayssince>=3 && element.dayssince<=6){
            iteration=3;
        }
        
        else if(element.dayssince>=0 && element.dayssince<=2){
            iteration=4;
            sendEmail=true;
        }


        // await DeliverEmailRepo.find({ IsDelivered: false, Email: { $ne: null } })
        //     .populate('User._id')
        //     .sort({ CreatedOn: -1 })
        // const _user = await UserRepo.findOne({ _id: mongoose.Types.ObjectId(element.User) })
        // var generatedlink =
        //         config.APP_BASE_URL + "auth/VerifiedEmail/" + Linkresult._id.toString();
        fs.readFile(__dirname + "/EmailTemplates/CSA_LicenseExpiry.html", function read(
            err,
            bufcontent
        ) {
            var content = bufcontent.toString();
            content = content.replace("##FirstName##", _user.FirstName);
            content = content.replace("##ProductName##", config.ProductName);
            content = content.replace("##DaysLeft##", element.dayssince);
            
            var mailObject = SendMail.GetMailObject(
                element.Admin.Email,
                "License Expirey Alert",
                content,
                null, null
            );
            // console.log('mail',mailObject);
            SendMail.sendEmail(mailObject, async function (res) {
                console.log(res);
                var alert=new DeliverEmailRepo({
                    Email:element.Admin.Email,
                    Type:'CSA-Expiry',
                    IsDelivered:true,
                    Subject:'CSA- License Expiry Alert',
                    User:element.Admin._id,
                    Company:element._id
                })
                await alert.save();
                //await DeliverEmailRepo.update({ _id: element._id }, { IsDelivered: true })
            });

        });

    }
}
task.FindAboutToExpireCompanies = async () => {
    var q30=await OrganizationRepo.aggregate([
        { 
            "$redact": {
            "$cond": {
                "if": {
                    "$lt": [
                        { "$subtract": [  "$LicenseExpireOn",new Date() ] },
                        1000 * 60 * 60 * 24*30
                    ]
                },
                "then": "$$KEEP",
                "else": "$$PRUNE"
            }
        }},
        {
        $project: {
            Name: 1,
            Email:1,
            _id:1
        }
    }
    ])
    //console.table(q30);
 
  //  console.table(companyList)
    var _f=[];
    for (let index = 0; index < q30.length; index++) {
        const element = q30[index];
        var _de=await DeliverEmailRepo.findOne({Queue:'Q30',Company:element._id})
        /**_de is null means no record got inserted for that company for the Q30 Days */
        if(_de===null){
            _f.push({Email:element.Email,Model:'Organization',User:element._id,Company:element._id, Queue:'Q30',IsDelivered:false,Subject:"License will expire with in 30 days"})
        }
    }
    var _result=await DeliverEmailRepo.insertMany(_f);
    

   

}

//Task to find all expaired subscription email
task.findExpaireSubscription = async () => {
    let whereObj = {} ;
    let psaUser;
    //whereObj['type']="monthly";
    whereObj['nextPaymentDate']={"$lte":moment()};

    console.log(JSON.stringify(whereObj,null,5));
    let scubScriptionsList = await subscriptionSchema.find(whereObj).populate("orgnizationId");
    if(scubScriptionsList.length>0){
        psaUser = await UserRepo.findOne({Role:'PSA'});
    }
    scubScriptionsList.forEach(subscription => {
        //console.log(JSON.stringify(subscription,null,5));
        let {orgnizationId} = subscription;
        fs.readFile(__dirname + "/EmailTemplates/RenewalSubscription.html", function read(
            err,
            bufcontent
        ) {
            var content = bufcontent.toString();
            content = content.replace("##FirstName##", orgnizationId.Name);
            content = content.replace("##TYPE##", subscription.type);
            content = content.replace("##ProductName##", config.ProductName);
            let toEmailArray = [];
            toEmailArray.push(orgnizationId.Email);
            toEmailArray.push(psaUser.Email);
            console.log(`sending email to ${JSON.stringify(toEmailArray)}`);
            var mailObject = SendMail.GetMailObject(
                toEmailArray,
                "Renewal Email",
                content,
                null, null
            );
            // console.log('mail',mailObject);
            SendMail.sendEmail(mailObject, async function (res) {
                console.log(res);
                await DeliverEmailRepo.update({ _id: subscription._id }, { IsDelivered: true })
            });
        });
    });

    //console.log(JSON.stringify(scubScriptionsList,null,5));
}


task.findSubscriptionsForPaymentRemainder = async () => {
    console.log("inside:findSubscriptionsForPaymentRemainder");
    let currentMoment = moment();
    let whereObj = {} ;
    whereObj['nextPaymentDate']={"$gt":currentMoment};
    console.log(whereObj)
    let scubScriptionsList = await subscriptionSchema.find(whereObj).populate("orgnizationId");
    console.log(scubScriptionsList.length)
    scubScriptionsList.forEach(subscription => {
        //console.log(JSON.stringify(subscription,null,5));
        let {orgnizationId,nextPaymentDate} = subscription;
        let dueMoment = moment(nextPaymentDate);
        var diffDays = dueMoment.diff(currentMoment, 'days');
        console.log(`dueMoment = > ${dueMoment}`);
        console.log(`currentMoment = > ${currentMoment}`);
        console.log(`days = > ${diffDays}`);
        if(diffDays === 7 || diffDays ===3){
            fs.readFile(__dirname + "/EmailTemplates/PaymentRemainder.html", function read(
                err,
                bufcontent
            ) {
                var content = bufcontent.toString();
                content = content.replace("##FirstName##", orgnizationId.Name);
                content = content.replace("##DAYS##", diffDays);
                content = content.replace("##DUEDATE##", nextPaymentDate);
                let toEmailArray = [];
                toEmailArray.push(orgnizationId.Email);
                console.log(`sending email to ${JSON.stringify(toEmailArray)}`);
                var mailObject = SendMail.GetMailObject(
                    toEmailArray,
                    "Renewal Email",
                    content,
                    null, null
                );
                // console.log('mail',mailObject);
                SendMail.sendEmail(mailObject, async function (res) {
                    console.log(res);
                    await DeliverEmailRepo.update({ _id: subscription._id }, { IsDelivered: true })
                });
            });
        }

        /**/
    });

    //console.log(JSON.stringify(scubScriptionsList,null,5));
}

task.findPaymentRemainderToPSA_CSA_EA = async () => {
    console.log("inside:findSubscriptionsForPaymentRemainder");
    let toEmailArray = [];
    let currentMoment = moment();

    let psaUser = await UserRepo.findOne({Role:'PSA'});
    let eaUser = await UserRepo.findOne({Role:'EA'});
    toEmailArray.push(psaUser.Email);
    toEmailArray.push(eaUser.Email);

    let scubScriptionsList = await subscriptionSchema.find().populate("orgnizationId");
    scubScriptionsList.forEach(subscription => {
        //console.log(JSON.stringify(subscription,null,5));
        let {orgnizationId,nextPaymentDate} = subscription;
        let dueMoment = moment(nextPaymentDate);
        var diffDays = dueMoment.diff(currentMoment, 'days');
        console.log(`dueMoment = > ${dueMoment}`);
        console.log(`currentMoment = > ${currentMoment}`);
        console.log(`days = > ${diffDays}`);
        let emailNotify = false;
        switch (diffDays) {
            case 30:
                emailNotify = true;
                console.log("30 days")
                break;
            case 14:
                console.log("14 days");
                emailNotify = true;
                break;
            case 7:
                console.log("7 days");
                emailNotify = true;
                break;
            case 3:
                console.log("3 days");
                emailNotify = true;
                break;
            case 0:
                console.log("3 days");
                emailNotify = true;
                break;
            case -3:
                console.log("3 days");
                emailNotify = true;
                break;
            case -7:
                console.log("3 days");
                emailNotify = true;
                break;
            default:
                break;
        }
        
        if(emailNotify){
            sendEmailNotification(diffDays,toEmailArray,subscription);
        }
        
    });

    //console.log(JSON.stringify(scubScriptionsList,null,5));
}

const sendEmailNotification = (diffDays,toEmailArray,subscription)=> {
    let {orgnizationId,nextPaymentDate} = subscription;
    fs.readFile(__dirname + "/EmailTemplates/DownloadRemainder.html", function read(
        err,
        bufcontent
    ) {
        var content = bufcontent.toString();
        content = content.replace("##FirstName##", orgnizationId.Name);
        content = content.replace("##DAYS##", diffDays);
        content = content.replace("##DUEDATE##", nextPaymentDate);
        
        toEmailArray.push(orgnizationId.Email);
        console.log(`sending email to ${JSON.stringify(toEmailArray)}`);
        var mailObject = SendMail.GetMailObject(
            toEmailArray,
            "Renewal Email",
            content,
            null, null
        );
        // console.log('mail',mailObject);
        SendMail.sendEmail(mailObject, async function (res) {
            console.log(res);
            await DeliverEmailRepo.update({ _id: subscription._id }, { IsDelivered: true })
        });
    });
}


module.exports = task;