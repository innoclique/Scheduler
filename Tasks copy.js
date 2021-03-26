//var UserManager = require("./Repos/UserManager.js");
require('./model/User');
require('./model/Packages');

const moment = require('moment');
var fs = require("fs");

var mongoose = require("mongoose");
const EvaluationRepo = require('./model/Evalution');
const DeliverEmailRepo = require('./model/DeliverEmail');
const UserRepo = require('./model/UserSchema');
const OrganizationRepo = require('./model/OrganizationSchema');
const subscriptions = require('./model/subscriptionSchema');
const clientconfigurations = require('./model/clientConfigurationsSchema');


var SendMail = require("./helpers/mail.js");
var env = process.env.NODE_ENV || 'dev';
var appConfig = require('./config/' + env + '.config');

var task = function () { };
var generatedlink = appConfig.APP_BASE_URL.toString();

function onNthDayFromTodayFilter(n) {
    return {
        $gte: moment().add(n, "day").startOf("day").toDate(),
        $lt: moment().add(n, "day").endOf("day").toDate()
    }
}

function onNthWeekFromTodayFilter(n) {
    return {
        $gte: moment().add(n, "week").startOf("day").toDate(),
        $lt: moment().add(n, "week").endOf("day").toDate()
    }
}

function onNthMonthFromTodayFilter(n) {
    return {
        $gte: moment().add(n, "month").startOf("day").toDate(),
        $lt: moment().add(n, "month").endOf("day").toDate()
    }
}

function onNdaysBackFromTodayFilter(n) {
    return {
        $gte: moment().subtract(n, "day").startOf("day").toDate(),
        $lt: moment().subtract(n, "day").endOf("day").toDate()
    }
}

function onNWeeksBackFromTodayFilter(n) {
    return {
        $gte: moment().subtract(n, "week").startOf("day").toDate(),
        $lt: moment().subtract(n, "week").endOf("day").toDate()
    }
}

function onNMonthsBackFromTodayFilter(n) {
    return {
        $gte: moment().subtract(n, "month").startOf("day").toDate(),
        $lt: moment().subtract(n, "month").endOf("day").toDate()
    }
}

task.getAllRemaindersOfTheDay = async () => {
    console.log('came into getAllRemaindersOfTheDay');
    await clientconfigurations.find()
        .distinct('ConfigKey', function (error, remainderTypes) {
            console.log('remainderTypes : ', remainderTypes);
            for (let type of remainderTypes) {
                console.log('type :: ', type);
                processRemainderType(type);
            }
        });
}

function processRemainderType(type) {
    console.log('inside processRemainderType : ', type);

    switch (type) {
        case 'Evaluation Period is starting soon':
            task.NotifyEvaluationPeriodIsStartingSoon(type);
            break;
        case 'Evaluation Period ending on <date> - Employee':
            task.NotifyEvaluationPeriodIsStartingSoon();
            break;
        case 'Evaluation Period ending on <date> - Employee Manager':
            task.NotifyEvaluationPeriodIsStartingSoon();
            break;
        case 'Evaluation Period ending on <date> - Evaluation Adminstrator':
            task.NotifyEvaluationPeriodIsStartingSoon();
            break;
        case 'PG-SIGNOFF':
            break;
        default:
            break;
    }
}

task.prepareTimeFilters = async (configurations) => {
    console.log('came into prepareTimeFilters');
    var timeFilters = [];
    for (let config of configurations) {
        if (config.TimeUnit === 'DAYS') {
            if (config.onBeforeAfter === 'After') {
                var timeFilter = onNthDayFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            } else {
                var timeFilter = onNdaysBackFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            }
        } else if (config.TimeUnit === 'WEEKS') {
            if (config.onBeforeAfter === 'After') {
                var timeFilter = onNthWeekFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            } else {
                var timeFilter = onNWeeksBackFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            }
        } else if (config.TimeUnit === 'MONTHS') {
            if (config.onBeforeAfter === 'After') {
                var timeFilter = onNthMonthFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            } else {
                var timeFilter = onNMonthsBackFromTodayFilter(config.ActivateWithin);
                timeFilters.push(timeFilter);
            }
        }

    }
    console.log('timeFilters : ', timeFilters);
    return timeFilters;
}

function findDefaultConfigurations(configType) {
    return configurations = findOrgSpecificConfigurations(appConfig.serviceOrganizationID, configType);
}

function findOrgSpecificConfigurations(orgId, configType) {
    return configurations = await clientconfigurations.find({ 'ConfigKey': configType });
}


task.NotifyEvaluationPeriodIsStartingSoon = async (configType) => {
    console.log('came into NotifyEvaluationPeriodIsStartingSoon');

    var timeFilters = await task.prepareTimeFilters(configurations);
    console.log("=================================start");
    for (let timeFilter of timeFilters) {
        console.log('timeFilter : ', timeFilter);
        var result = await subscriptions.find({
            ActivatedOn: timeFilter
        });
        console.log('result : ', result);

    }
    console.log("=================================end");

    // var _orgIds = withInMonthList.map(x => mongoose.Types.ObjectId(x.Organization));
    // console.log('current _orgIds:::', _orgIds);
    // // let currentYear = await EvaluationUtils.GetOrgEvaluationYear(orgId);
    // // console.log('currentYear :: ',currentYear);

    // const _EA_users = await UserRepo.find({ $and: [{ Organization: { $in: _orgIds } }, { 'Role': 'EO' }] })
    // // console.log('current o/p:::', _EA_users);

    // var _deliveremails = [];

    // for (let index = 0; index < _EA_users.length; index++) {
    //     _deliveremails.push({
    //         User: _EA_users[index],
    //         Type: 'generic',
    //         IsDelivered: true,
    //         Email: _EA_users[index].Email,
    //         Template: `<p>Dear ${_EA_users[index].FirstName} <br/></p>
    //             <p>There is One Month left to the start of the evaluation period.

    //                 To login, <a href="${generatedlink}">click here</a>.

    //             <br/></p>
    //             <br/>
    //             <p>Thank you,<br/>
    //             ${appConfig.ProductName}</p>`,
    //         Company: _EA_users.Organization,
    //         Subject: 'Evaluation Period is starting soon'
    //     });

    // }

    // var de = await DeliverEmailRepo.insertMany(_deliveremails);
    // console.log('de ids :::', de);
}

task.sendUndeliveredGenericMails = async () => {
    console.log('came into email send functionality2222')
    var list = await DeliverEmailRepo.find({ IsDelivered: false, Type: 'generic', Email: { $ne: null } })
        .sort({ CreatedOn: -1 })
    console.log('count', list.length)
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
        fs.readFile(__dirname + "/EmailTemplates/EmailTemplate.html", function read(
            err,
            bufcontent
        ) {
            var content = bufcontent.toString();
            content = content.replace("##Title##", element.Subject);
            content = content.replace("##subTitle##", element.Subject);
            content = content.replace('##Template##', element.Template);

            var mailObject = SendMail.GetMailObject(
                element.Email,
                element.Subject,
                content,
                null, null
            );

            SendMail.sendEmail(mailObject, async function (res) {
                // console.log(res);
                await DeliverEmailRepo.update({ _id: element._id }, { IsDelivered: true })
            });

        });

    }
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
        // // ============================
        // var mailObject = SendMail.GetMailObject(
        //     element.Email,
        //     element.Subject,
        //     element.Template,
        //     null, null
        // );
        // // console.log('mail',mailObject);
        // SendMail.sendEmail(mailObject, async function (res) {
        //     console.log(res);
        //     await DeliverEmailRepo.update({ _id: element._id }, { IsDelivered: true })
        // });

        //=============================
        // var generatedlink =
        //         config.APP_BASE_URL + "auth/VerifiedEmail/" + Linkresult._id.toString();
        fs.readFile(__dirname + "/EmailTemplates/aa.html", function read(
            err,
            bufcontent
        ) {
            var content = bufcontent.toString();
            content = content.replace("##Title##", element.Subject);
            content = content.replace("##subTitle##", element.Subject);
            content = content.replace("##FirstName##", _user.FirstName);
            content = content.replace("##ProductName##", appConfig.ProductName);
            content = content.replace('##Template##', element.Template);

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

    const count1 = await OrganizationRepo.countDocuments();
    console.log('count', count1)
    var list = await OrganizationRepo.aggregate(
        [
            { $match: { ClientType: 'Client' } },
            {
                $project:
                {
                    _id: 1,
                    Admin: 1,
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
        console.log('element', element)
        var iteration = 1;
        var sendEmail = false;
        if (element.dayssince >= 15 && element.dayssince <= 31) {
            iteration = 1;
        }
        else if (element.dayssince >= 7 && element.dayssince <= 14) {
            iteration = 2;
        }

        else if (element.dayssince >= 3 && element.dayssince <= 6) {
            iteration = 3;
        }

        else if (element.dayssince >= 0 && element.dayssince <= 2) {
            iteration = 4;
            sendEmail = true;
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
            content = content.replace("##ProductName##", appConfig.ProductName);
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
                var alert = new DeliverEmailRepo({
                    Email: element.Admin.Email,
                    Type: 'CSA-Expiry',
                    IsDelivered: true,
                    Subject: 'CSA- License Expiry Alert',
                    User: element.Admin._id,
                    Company: element._id
                })
                await alert.save();
                //await DeliverEmailRepo.update({ _id: element._id }, { IsDelivered: true })
            });

        });

    }
}
task.FindAboutToExpireCompanies = async () => {
    var q30 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 30
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    //console.table(q30);

    //  console.table(companyList)
    var _f = [];
    for (let index = 0; index < q30.length; index++) {
        const element = q30[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q30', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q30 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q30', IsDelivered: false, Subject: "License will expire with in 30 days" })
        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);

}
task.FindAboutToExpireCompaniesInQueues = async () => {
    var q30 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 30
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    console.log('q30')
    console.table(q30);

    //  console.table(companyList)
    var _f = [];
    debugger
    for (let index = 0; index < q30.length; index++) {
        const element = q30[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q30', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q30 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q30', IsDelivered: false, Subject: "License will expire with in 30 days" })
        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);

    /**For Q14 Begin*/
    var q14 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 14
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    //console.table(q30);

    //  console.table(companyList)
    var _f = [];
    for (let index = 0; index < q30.length; index++) {
        const element = q30[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q14', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q14 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q14', IsDelivered: false, Subject: "License will expire with in 14 days" })

        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);

    /**For Q14 End */

    /**For Q7 Begin*/
    var q7 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 7
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    console.log('q7')
    console.table(q7);

    //  console.table(companyList)
    var _f = [];
    for (let index = 0; index < q7.length; index++) {
        const element = q7[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q7', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q14 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q7', IsDelivered: false, Subject: "License will expire with in 14 days" })

        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);

    /**For Q7 End */

    /**For Q3 Begin*/

    var q3 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 3
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    console.table(q3);

    //  console.table(companyList)
    var _f = [];
    for (let index = 0; index < q3.length; index++) {
        const element = q3[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q3', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q3 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q3', IsDelivered: false, Subject: "License will expire with in 14 days" })

        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);
    /**For Q3 End*/
    /**For Q1 Begin*/
    var q1 = await OrganizationRepo.aggregate([
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$lt": [
                            { "$subtract": ["$LicenseExpireOn", new Date()] },
                            1000 * 60 * 60 * 24 * 1
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            $project: {
                Name: 1,
                Email: 1,
                _id: 1
            }
        }
    ])
    console.table(q1);

    //  console.table(companyList)
    var _f = [];
    for (let index = 0; index < q1.length; index++) {
        const element = q1[index];
        var _de = await DeliverEmailRepo.findOne({ Queue: 'Q1', Company: element._id })
        /**_de is null means no record got inserted for that company for the Q1 Days */
        if (_de === null) {
            _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q1', IsDelivered: false, Subject: "License will expire with in 14 days" })

        }
    }
    var _result = await DeliverEmailRepo.insertMany(_f);
    /**For Q1 End*/

}

task.RemindEvaluationRollout = async () => {
    var qlist = [30, 14, 7, 3, 1];
    for (let index = 0; index < qlist.length; index++) {
        const element = qlist[index];
        var startedList = await EvaluationRepo.find({}, { id: 1, Company: 1 }).map(function (a) { return a.Company; })
        var notstartedList = await OrganizationRepo.find({ _id: { $nin: startedList } });
        var q30 = await OrganizationRepo.aggregate([
            {
                "$redact": {
                    "$cond": {
                        "if": {
                            "$lt": [
                                { "$subtract": ["$LicenseExpireOn", new Date()] },
                                1000 * 60 * 60 * 24 * 30
                            ]
                        },
                        "then": "$$KEEP",
                        "else": "$$PRUNE"
                    }
                }
            },
            {
                $project: {
                    Name: 1,
                    Email: 1,
                    _id: 1
                }
            }
        ])
        console.log('q30')
        console.table(q30);

        //  console.table(companyList)
        var _f = [];
        for (let index = 0; index < q30.length; index++) {
            const element = q30[index];
            var _de = await DeliverEmailRepo.findOne({ Queue: 'Q30', Company: element._id })
            /**_de is null means no record got inserted for that company for the Q30 Days */
            if (_de === null) {
                _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q30', IsDelivered: false, Subject: "License will expire with in 30 days" })
            }
        }
        var _result = await DeliverEmailRepo.insertMany(_f);

    }

}
task.RemindToManager = async () => {
    var unsubmittedList = await EvaluationRepo.find({ "Employees.IsSubmitted": false, IsActive: true }).populate({ path: "Employees._id", populate: { path: Manager } })
    if (unsubmittedList) {
        console.log('empl list', unsubmittedList);
        var _f = [];
        for (let index = 0; index < unsubmittedList.length; index++) {
            const element = unsubmittedList[index];
            var _de = await DeliverEmailRepo.findOne({ Queue: 'Q30', Company: element._id })
            /**_de is null means no record got inserted for that company for the Q30 Days */
            if (_de === null) {
                _f.push({ Email: element.Email, Model: 'Organization', User: element._id, Company: element._id, Queue: 'Q30', IsDelivered: false, Subject: "License will expire with in 30 days" })
            }
        }
        var _result = await DeliverEmailRepo.insertMany(_f);

    }
}

module.exports = task;