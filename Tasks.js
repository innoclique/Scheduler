//var UserManager = require("./Repos/UserManager.js");
var mongoose = require("mongoose");
require('./model/User')
require('./model/Packages')
const Mongoose = require("mongoose");
var fs = require("fs");
const EvaluationRepo = require('./model/Evalution');
const DeliverEmailRepo = require('./model/DeliverEmail');
const UserRepo = require('./model/UserSchema');
const OrganizationRepo = require('./model/OrganizationSchema')
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
module.exports = task;