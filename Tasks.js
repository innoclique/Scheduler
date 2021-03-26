require('./model/User');
require('./model/Packages');
const got = require("got");

const moment = require('moment');
var fs = require("fs");

var mongoose = require("mongoose");
const EvaluationRepo = require('./model/Evalution');
const DeliverEmailRepo = require('./model/DeliverEmail');
const UserRepo = require('./model/UserSchema');
const OrganizationRepo = require('./model/OrganizationSchema');
const subscriptions = require('./model/subscriptionSchema');
const clientconfigurations = require('./model/clientConfigurationsSchema');
const statuses = require('./model/statuses');
const PaymentReleasesSchema = require('./model/PaymentReleasesSchema');
const kpiform = require('./model/KpiForms');


const util = require('./utils/EvaluationUtils');

var SendMail = require("./helpers/mail.js");
var env = process.env.NODE_ENV || 'dev';
var appConfig = require('./config/' + env + '.config');

var task = function () { };
var generatedlink = appConfig.APP_BASE_REDIRECT_URL.toString();


task.getAllRemaindersOfTheDay = async () => {
    console.log('came into getAllRemaindersOfTheDay');
    var remainderTypes = await clientconfigurations.find()
        .distinct('ConfigKey', function (error, remainderTypes) {
            console.log('remainderTypes : ', remainderTypes);
            return remainderTypes;
        });
    for (let type of remainderTypes) {
        console.log('type :: ', type);
        await task.processRemainderType(type);
    }
}

task.processRemainderType = async (type) => {
    console.log('inside processRemainderType : ', type);

    switch (type) {
        case 'Evaluation Period is starting soon':
            // task.NotifyEvaluationPeriodIsStartingSoon(type);
            break;
        case 'Evaluation Period ending on <date> - Employee':
            task.NotifyEvaluationPeriodIsEndingSoonForEmployee();
            break;
        // case 'Evaluation Period ending on <date> - Employee Manager':
        //     task.NotifyEvaluationPeriodIsStartingSoon();
        //     break;
        // case 'Evaluation Period ending on <date> - Evaluation Adminstrator':
        //     task.NotifyEvaluationPeriodIsStartingSoon();
        //     break;
        case 'PG-SIGNOFF':
            break;
        default:
            break;
    }
}


task.sendUndeliveredGenericMails = async () => {
    console.log('came into email send functionality')
    var list = await DeliverEmailRepo.find({ IsDelivered: false, Email: { $ne: null } })
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

task.findDefaultConfigurations = async (configType) => {
    return configurations = task.findOrgSpecificConfigurations(appConfig.serviceOrganizationID, configType);
}

task.findOrgSpecificConfigurations = async (orgId, configType) => {
    return configurations = await clientconfigurations.find({ 'ConfigKey': configType, 'Organization': mongoose.Types.ObjectId(orgId) });
}

task.findOrgsWithSpecificConfigurations = async (configType) => {
    return configurations = await clientconfigurations.find({ 'ConfigKey': configType, 'Organization': { $ne: mongoose.Types.ObjectId(appConfig.serviceOrganizationID) } });
}

task.NotifyEvaluationPeriodIsStartingSoon = async (configType) => {//117
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodIsStartingSoon');
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var subscribedOrgs = await subscriptions.find({
        // ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    });
    var subscribedOrgsIds = subscribedOrgs.map(x => x.Organization);
    for (let subscribedOrgsId of subscribedOrgsIds) {
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(subscribedOrgsId);
        var now = moment(); //todays date

        var end = moment(evalStartEndDates.start).add(1, 'years'); // another date
        var duration = moment.duration(end.diff(now));
        var days = duration.asDays();
        var period = null;
        console.log(`today : ${now} startDate:${end} orgId : ${subscribedOrgsId}`);
        console.log('days : ', Math.ceil(days))
        switch (Math.ceil(days)) {
            case 30:
                period = ' a month ';
                break;
            case 18:
                period = ' 18 days ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;

            default:
                break;
        }
        if (period) {
            const _EA_users = await UserRepo.find({ Organization: mongoose.Types.ObjectId(subscribedOrgsId), 'SelectedRoles': "EA" })
            for (let index = 0; index < _EA_users.length; index++) {
                _deliveremails.push({
                    User: _EA_users[index],
                    Type: 'generic',
                    IsDelivered: true,
                    Email: _EA_users[index].Email,
                    Template: `<p>Dear ${_EA_users[index].FirstName} <br/></p>
                                <p>There is ${period} left to the start of the evaluation period.<br/><br/>

                                    To login, <a href="${generatedlink}">click here</a>.

                                <br/></p>
                                <br/>
                                <p>Thank you,<br/>
                                ${appConfig.ProductName} Administrator</p>`,
                    Company: _EA_users[index].Company,
                    Subject: 'Evaluation Period is starting soon'
                });
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.NotifyEvaluationPeriodIsEndingSoonForEmployee = async (configType) => { //120
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodIsEndingSoonForEmployee');
    var evalCompletedStatusIds = await statuses.find({ 'Status': 'Evaluation Complete' });
    evalCompletedStatusIds = evalCompletedStatusIds.map(x => mongoose.Types.ObjectId(x._id));
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var pendingEvaluations = await EvaluationRepo.find({
        // $and: [{
        "Employees": {
            $elemMatch: {
                Status: {
                    $nin: evalCompletedStatusIds
                }
            }
        }
        // }, { 'Company': mongoose.Types.ObjectId(subscribedOrgsId) }]
    }).populate('Company Employees._id');

    for (let pendingEvaluation of pendingEvaluations) {
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(pendingEvaluation.Company._id);
        var now = moment(); //todays date
        var end = moment(evalStartEndDates.end); // another date
        var duration = moment.duration(end.diff(now));
        var days = duration.asDays();
        var period = null;
        console.log(`today : ${now} startDate:${end} orgId : ${pendingEvaluation.Company.Name}`);
        console.log('days : ', Math.ceil(days))
        switch (Math.ceil(days)) {
            case 30:
                period = ' a month ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 18:
                period = ' 18 days ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;
            default:
                break;
        }
        if (period) {
            // const _EA_users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(subscribedOrgsId) }, { 'Role': 'EA' }] })
            for (let index = 0; index < pendingEvaluation.Employees.length; index++) {
                var userObj = pendingEvaluation.Employees[index]._id;
                _deliveremails.push({
                    User: userObj,
                    Type: 'generic',
                    IsDelivered: true,
                    Email: userObj.Email,
                    Template: `<p>Dear ${userObj.FirstName} <br/></p>
                            There are ${period} left to the end of the evaluation period.<br/><br/>

                            To complete and submit your evaluation, <a href="${generatedlink}employee/current-evaluation">click here</a>.
                            <br/></p>
                            <br/>
                            <p>Thank you,<br/>
                            ${appConfig.ProductName} Administrator</p>`,
                    Company: pendingEvaluation.Company._id,
                    Subject: `Evaluation Period ending on ${evalStartEndDates.end}`
                });
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
}

task.NotifyEvaluationPeriodIsEndingSoonEA = async (configType) => {//118
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodIsEndingSoonEA');
    var evalCompletedStatusIds = await statuses.find({ 'Status': 'Evaluation Complete' });
    evalCompletedStatusIds = evalCompletedStatusIds.map(x => mongoose.Types.ObjectId(x._id));
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var pendingEvaluations = await EvaluationRepo.find({
        // $and: [{
        "Employees": {
            $elemMatch: {
                Status: {
                    $nin: evalCompletedStatusIds
                }
            }
        }
        // }, { 'Company': mongoose.Types.ObjectId(subscribedOrgsId) }]
    }).populate('Company Employees._id');

    for (let pendingEvaluation of pendingEvaluations) {
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(pendingEvaluation.Company._id);
        var now = moment(); //todays date
        var end = moment(evalStartEndDates.end); // another date
        var duration = moment.duration(end.diff(now));
        var days = duration.asDays();
        var period = null;
        console.log(`today : ${now} endDate:${end} orgId : ${pendingEvaluation.Company.Name}`);
        console.log('days : ', Math.ceil(days))
        switch (Math.ceil(days)) {
            case 30:
                period = ' a month ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 18:
                period = ' 18 days ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;
            default:
                break;
        }
        if (period) {
            const _EA_users = await UserRepo.find({ Organization: mongoose.Types.ObjectId(pendingEvaluation.Company._id), 'SelectedRoles': "EA" })
            console.log('_EA_users : ', JSON.stringify(_EA_users));
            for (let index = 0; index < _EA_users.length; index++) {
                var userObj = _EA_users[index];
                _deliveremails.push({
                    User: userObj,
                    Type: 'generic',
                    IsDelivered: true,
                    Email: userObj.Email,
                    Template: `<p>Dear ${userObj.FirstName} <br/></p>
                            <p>There are ${period} left to the end of the evaluation period. <br/>
                            You may want to check the statuses of the rolled-out evaluations.<br/><br/>
                            
                            
                            To login, <a href="${generatedlink}">click here</a>.

                            <br/></p>
                            <br/>
                            <p>Thank you,<br/>
                            ${appConfig.ProductName} Administrator</p>`,
                    Company: userObj.Company,
                    Subject: `Evaluation Period ending on ${evalStartEndDates.end}`
                });
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
}

task.NotifyEvaluationPeriodIsEndingSoonEM = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodIsEndingSoonEA');
    var evalCompletedStatusIds = await statuses.find({ 'Status': 'Evaluation Complete' });
    evalCompletedStatusIds = evalCompletedStatusIds.map(x => mongoose.Types.ObjectId(x));
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var pendingEvaluations = await EvaluationRepo.find({
        // $and: [{
        "Employees": {
            $elemMatch: {
                Status: {
                    $nin: evalCompletedStatusIds
                }
            }
        }
        // }, { 'Company': mongoose.Types.ObjectId(subscribedOrgsId) }]
    }).populate('Company Employees._id');

    for (let pendingEvaluation of pendingEvaluations) {
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(pendingEvaluation.Company);
        var now = moment(); //todays date
        var end = moment(evalStartEndDates.end); // another date
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)
        switch (days) {
            case 30:
                period = ' a month ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;
            default:
                break;
        }
        if (period) {
            // const _EA_users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(pendingEvaluation.Company._id) }, { 'Role': 'EA' }] })
            for (let index = 0; index < pendingEvaluation.Employees.length; index++) {
                var userObj = await UserRepo.find({ _id: pendingEvaluation.Employees[index]._id.directReports })
                _deliveremails.push({
                    User: userObj,
                    Type: 'generic',
                    IsDelivered: true,
                    Email: userObj.Email,
                    Template: `<p>Dear ${userObj.FirstName} <br/></p>
                            <p>There are ${period} left to the end of the evaluation period. 
                            You may want to check the statuses of the rolled-out evaluations.
                            
                            
                            To login, <a href="${generatedlink}">click here</a>.

                            <br/></p>
                            <br/>
                            <p>Thank you,<br/>
                            ${appConfig.ProductName}</p>`,
                    Company: employees.Company,
                    Subject: `Evaluation Period ending on ${evalStartEndDates.end}`
                });
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
}

// task.NotifyTimeToSetupTheCoachingSessionEM = async (configType) => {
//     var _deliveremails = [];
//     console.log('came into NotifyTimeToSetupTheCoachingSessionEM');
//     var subscribedOrgs = await subscriptions.find({
//         ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
//     })
//         .populate('Organization');
//     subscribedOrgs = subscribedOrgs.map(x => x.Organization);
//     for (let org of subscribedOrgs) {
//         var sendReminder = false;
//         if (org.LastReminded) {
//             var now = moment(); //todays date
//             var end = moment(org.LastReminded); // another date
//             var duration = moment.duration(now.diff(end));
//             var days = duration.asDays();
//             if (days = CoachingReminder) {
//                 sendReminder = true;
//             }
//         } else {
//             sendReminder = true;
//         }
//         if (sendReminder) {
//             const _empMgrs = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(org._id) }, { 'Role': 'EA' }] })
//             _empMgrs.map(mgr => {
//                 var empTable = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
//             <thead>
//                 <th>
//                     Name
//                 </th>
//                 <th>
//                     Email
//                 </th>
//                 <th>
//                     Phone
//                 </th>
//             </thead>`;

//                 var directReportees = await UserRepo.find({ DirectReports: mongoose.Types.ObjectId(mgr._id) })
//                 for (let directReportee of directReportees) {
//                     empTable = `${empTable} 
//                 <tr>
//                 <td>
//                 ${directReportee.FirstName} ${directReportee.LastName}
//                 </td>
//                 <td>
//                 ${directReportee.Email}
//                 </td>
//                 <td>
//                 ${directReportee.PhoneNumber}
//                 </td>
//                 </tr>`;
//                 }

//                 empTable = empTable + ` </table></p>`;
//                 _deliveremails.push({
//                     User: mgr,
//                     Type: 'Time to setup the coaching session',
//                     IsDelivered: false,
//                     Email: mgr.Email,
//                     Template: `<p>Dear ${mgr.FirstName} <br/></p>
//                 <p>You may want to setup some time for coaching your direct reports, it has been x days.</p>

//                 <br/>
//                 ${empTable}
//                 <br/></p>
//                 <p>In case the coaching session has been already scheduled, please ignore the email.</p>
//                 <br/>
//                 <p>Thank you,<br/>
//                 OPAssess Admin</p>`,
//                     Company: _currentEvaluation.Company,
//                     Subject: 'Evaluations for your direct reports has been released'
//                 });

//             });
//         }
//     }

//     var de = await DeliverEmailRepo.insertMany(_deliveremails);
//     console.log('mails :::', _deliveremails);
//     console.log("=================================end");
// }

task.NotifySubscriptionIsExpiringOn = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifySubscriptionIsExpiringOn');
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    })
        .populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    var psaUser;
    var table = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
            <thead>
                <th>
                    Organization Name
                </th>
                <th>
                    Contact Person
                </th>
                <th>
                    Number
                </th>
                <th>
                    Email
                </th>
                <th>
                    Renewal Date
                </th>
                <th>
                    Download Buffer Ends
                </th>
                <th>
                    Override
                </th>
            </thead>`;
    for (let subscribedOrg of subscribedOrgs) {
        var now = moment(); //todays date
        var end = moment(subscribedOrg.ValidTill); // another date 
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)
        switch (days - parseInt(subscribedOrg.Organization.DownloadBufferDays)) {
            case 30:
                period = ' a month ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;

            default:
                break;
        }
        if (period) {
            // CSA, Client, EA, EO, PSA, RSA, Reseller

            const users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(subscribedOrgsId) }, { $or: [{ 'Role': "CSA" }, { 'Role': "PSA" }, { $or: [{ 'SelectedRoles': "EA" }] }] }] })
            for (let index = 0; index < users.length; index++) {
                var csaUser;
                if (users[index].Role == 'PSA') { psaUser = users[index]; }
                if (users[index].Role == 'CSA') {
                    csaUser = users[index];
                    _deliveremails.push({
                        User: users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: users[index].Email,
                        Template: `<p>Dear ${users[index].FirstName} <br/></p>
                                    <p>There are ${period} left for renewing the subscription. 
                                    You may choose to purchase the evaluations for next year or advise your organization to download their reports. 
                                    Access to the application will be disabled on ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}.<br/></p>
                                    <br/>
                                    <p>To renew the subscription, click here.</p>
                                    <p>Thank you,<br/>
                                    ${appConfig.ProductName}</p>`,
                        Company: users[index].Organization,
                        Subject: `Subscription is expiring on ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}`
                    });
                }
                if (users[index].Role == 'EA') {
                    _deliveremails.push({
                        User: users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: users[index].Email,
                        Template: `<p>Dear ${users[index].FirstName} <br/></p>
                                    <p>There are ${period} left for renewing the subscription. 
                                    You may choose to purchase the evaluations for next year or advise your organization to download their reports. 
                                    Access to the application will be disabled on ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}.<br/></p>
                                    <br/>
                                    <p>If you are not responsible for the renewals, please forward this email to the right person.</p>
                                    <p>Thank you,<br/>
                                    ${appConfig.ProductName}</p>`,
                        Company: users[index].Organization,
                        Subject: `Subscription is expiring on ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}`
                    });
                }


            }
        }
        table = `${table} 
        <tr>
            <td>
                ${subscribedOrg.Name}
            </td>
            <td>
                ${subscribedOrg.ContactPersonFirstName} ${subscribedOrg.ContactPersonLastName}
            </td>
            <td>
                ${subscribedOrg.Phone}
            </td>
            <td>
                ${subscribedOrg.Email}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).toDate()}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}
            </td>
            <td>
                Override
            </td>
        </tr>`;

    }
    table = table + ` </table></p>`;
    _deliveremails.push({
        User: psaUser,
        Type: 'generic',
        IsDelivered: false,
        Email: psaUser.Email,
        Template: `<p>Dear ${psaUser.FirstName} <br/></p>
                    <p>Payment is overdue for the following organizations and the download buffer is also ending soon.</p>

                    <br/>
                    ${table}
                    <br/></p>
                    <p>To view details, click here.</p>
                    <br/>
                    <p>Thank you,<br/>
                    OPAssess Admin</p>`,
        Company: psaUser.Company,
        Subject: 'Payments Overdue'
    });

    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.NotifyRenewalComingUp = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyRenewalComingUp');
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    })
        .populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    var psaUser;
    var table = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
                <thead>
                    <th>
                        Organization Name
                    </th>
                    <th>
                        Contact Person
                    </th>
                    <th>
                        Number
                    </th>
                    <th>
                        Email
                    </th>
                    <th>
                        Renewal Date
                    </th>
                    <th>
                        Download Buffer Ends
                    </th>
                    <th>
                        Override
                    </th>
                </thead>`;
    for (let subscribedOrg of subscribedOrgs) {
        var now = moment(); //todays date
        var end = moment(subscribedOrg.ValidTill); // another date 
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)
        switch (days - parseInt(subscribedOrg.Organization.DownloadBufferDays)) {
            case 30:
                period = ' a month ';
                break;
            case 21:
                period = ' 3 weeks ';
                break;
            case 7:
                period = ' 1 week ';
                break;
            case 3:
                period = ' 3 days ';
                break;
            case 0:
                period = ' 0 days ';
                break;

            default:
                break;
        }
        if (period) {
            // CSA, Client, EA, EO, PSA, RSA, Reseller

            const users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(subscribedOrgsId) }, { $or: [{ 'Role': "CSA" }, { 'Role': "PSA" }, { $or: [{ 'SelectedRoles': "EA" }] }] }] })
            for (let index = 0; index < users.length; index++) {
                var csaUser;
                if (users[index].Role == 'PSA') { psaUser = users[index]; }
                if (users[index].Role == 'CSA') {
                    csaUser = users[index];
                    _deliveremails.push({
                        User: users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: users[index].Email,
                        Template: `<p>Dear ${users[index].FirstName} <br/></p>
                                    <p>There are ${period} for the license to expire.<br/><br/>
                                    <p>To renew the license, click here.</p>
                                    <p>Thank you,<br/>
                                    ${appConfig.ProductName}</p>`,
                        Company: users[index].Organization,
                        Subject: `Action Needed: Renewal coming up`
                    });
                }
                if (users[index].Role == 'EA') {
                    var evalStartEndDates = await util.getOrganizationStartAndEndDates(users[index].Company);
                    _deliveremails.push({
                        User: users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: users[index].Email,
                        Template: `<p>Dear ${users[index].FirstName} <br/></p>
                                    <p>There are number of evaluations left on the license purchased and the evaluation period ends on ${evalStartEndDates.end}.</p>
                                    <p>Thank you,<br/>
                                    ${appConfig.ProductName} Administrator</p>`,
                        Subject: `Subscription is expiring on ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}`
                    });
                }


            }

            table = `${table} 
        <tr>
            <td>
                ${subscribedOrg.Name}
            </td>
            <td>
                ${subscribedOrg.ContactPersonFirstName} ${subscribedOrg.ContactPersonLastName}
            </td>
            <td>
                ${subscribedOrg.Phone}
            </td>
            <td>
                ${subscribedOrg.Email}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).toDate()}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}
            </td>
            <td>
                Override
            </td>
        </tr>`;
        }
    }
    table = table + ` </table></p>`;
    _deliveremails.push({
        User: psaUser,
        Type: 'generic',
        IsDelivered: false,
        Email: psaUser.Email,
        Template: `<p>Dear ${psaUser.FirstName} <br/></p>
                    <p>Payment is due for the following organizations.</p>

                    <br/>
                    ${table}
                    <br/></p>
                    <p>To view details, click here.</p>
                    <br/>
                    <p>Thank you,<br/>
                    OPAssess Admin</p>`,
        Company: psaUser.Company,
        Subject: 'Payments Due Soon'
    });

    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.NotifyEmployeeRangeEndingSoon = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyRenewalComingUp');
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    }).populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    var psaUser;
    var table = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
                <thead>
                    <th>
                        Organization Name
                    </th>
                    <th>
                        Contact Person
                    </th>
                    <th>
                        Number
                    </th>
                    <th>
                        Email
                    </th>
                    <th>
                        Renewal Date
                    </th>
                    <th>
                        Download Buffer Ends
                    </th>
                    <th>
                        Override
                    </th>
                </thead>`;
    for (let subscribedOrg of subscribedOrgs) {
        var orgEvalAvailability = await util.getEvaluationsAvailable(subscribedOrg.Organization._id);
        if (orgEvalAvailability.availablePercentage < 15) {
            // CSA, Client, EA, EO, PSA, RSA, Reseller
            const users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(subscribedOrgsId) }, { $or: [{ 'Role': "CSA" }, { 'Role': "PSA" }, { $or: [{ 'SelectedRoles': "EA" }] }] }] })
            for (let index = 0; index < users.length; index++) {
                var csaUser;
                if (users[index].Role == 'PSA') { psaUser = users[index]; }

                if (users[index].Role == 'CSA') {
                    var evalStartEndDates = await util.getOrganizationStartAndEndDates(users[index].Company);
                    _deliveremails.push({
                        User: users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: users[index].Email,
                        Template: `<p>Dear ${users[index].FirstName} <br/></p>
                                    <p>There are ${orgEvalAvailability.available} number of evaluations left on the license purchased and the evaluation period ends on ${evalStartEndDates.end}.</p>
                                    <p></br></br>To purchase new evaluations, click here.</p>
                                    <p>Thank you,<br/>
                                    ${appConfig.ProductName} Administrator</p>`,
                        Subject: `Action Needed: Employee range ending soon`
                    });
                }


            }

            table = `${table} 
        <tr>
            <td>
                ${subscribedOrg.Name}
            </td>
            <td>
                ${subscribedOrg.ContactPersonFirstName} ${subscribedOrg.ContactPersonLastName}
            </td>
            <td>
                ${subscribedOrg.Phone}
            </td>
            <td>
                ${subscribedOrg.Email}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).toDate()}
            </td>
            <td>
                ${moment(subscribedOrg.ValidTill).add(subscribedOrg.Organization.DownloadBufferDays, "day").endOf("day").toDate()}
            </td>
            <td>
                Override
            </td>
        </tr>`;
        }
    }
    table = table + ` </table></p>`;
    _deliveremails.push({
        User: psaUser,
        Type: 'generic',
        IsDelivered: false,
        Email: psaUser.Email,
        Template: `<p>Dear ${psaUser.FirstName} <br/></p>
                    <p>Payment is due for the following organizations.</p>

                    <br/>
                    ${table}
                    <br/></p>
                    <p>To view details, click here.</p>
                    <br/>
                    <p>Thank you,<br/>
                    ${appConfig.ProductName} Administrator</p>`,
        Company: psaUser.Company,
        Subject: 'Payments Due Soon'
    });

    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.NotifyEvaluationPeriodEndingOnEM = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodEndingOnEM');
    // const _empMgrs = await UserRepo.find({ 'SelectedRoles': "EM" });
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    }).populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    var evalCompletedStatusIds = await statuses.find({ 'Status': 'Evaluation Complete' });
    evalCompletedStatusIds = evalCompletedStatusIds.map(x => mongoose.Types.ObjectId(x));
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);

    for (let subscribedOrg of subscribedOrgs) {
        const _empMgrs = await UserRepo.find({ 'SelectedRoles': "EM", 'Organization': ObjectId(subscribedOrg._id) });
        var emps = [];
        var pendingEvaluations = await EvaluationRepo.find({
            $and: [{
                "Employees": {
                    $elemMatch: {
                        Status: {
                            $nin: evalCompletedStatusIds
                        }
                    }
                }
            }, { 'Company': mongoose.Types.ObjectId(subscribedOrg._id) }]
        }).populate('Company Employees._id Employees.Status Employees.Peers.EmployeeId Employees.DirectReportees.EmployeeId CreatedBy').sort({ CreatedDate: -1 })

        for (let pendingEvaluation of pendingEvaluations) {
            var evalStartEndDates = await util.getOrganizationStartAndEndDates(pendingEvaluation.Company);
            var now = moment(); //todays date
            var end = moment(evalStartEndDates.end); // another date
            var duration = moment.duration(now.diff(end));
            var days = duration.asDays();
            var period = null;
            console.log(days)
            switch (days) {
                case 30:
                    period = ' a month ';
                    break;
                case 21:
                    period = ' 3 weeks ';
                    break;
                case 7:
                    period = ' 1 week ';
                    break;
                case 3:
                    period = ' 3 days ';
                    break;
                case 0:
                    period = ' 0 days ';
                    break;
                default:
                    break;
            }
            if (period) {
                // const _EA_users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(pendingEvaluation.Company._id) }, { 'Role': 'EA' }] })
                pendingEvaluation.Employees = Employees;
                var _emps = pendingEvaluation.Employees.map(x => x._id);
                emps.push(_emps);
            }
        }
        _empMgrs.map(mgr => {
            var empTable = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
    <thead>
        <th>
            Name
        </th>
        <th>
            Email
        </th>
        <th>
            Evaluation Status
        </th>
    </thead>`;

            for (let emp of emps) {

                var manager = _Mgrs.find(mgr => mgr._id.toString() == emp._id.Manager.toString())

                // if (emp._id.DirectReports.toString() == mgr._id.toString() || emp._id.ThirdSignatory.toString() == mgr._id.toString()) {
                if (emp._id.DirectReports.toString() == mgr._id.toString()) {

                    empTable = `${empTable} 
        <tr>
        <td>
        ${emp._id.FirstName} ${emp._id.LastName}
        </td>
        <td>
        ${emp._id.Email}
        </td>
        <td>
        ${emp.Status.Status}
        </td>
        </tr>`;
                }
            }
            empTable = empTable + ` </table></p>`;
            _deliveremails.push({
                User: mgr._id,
                Type: 'generic',
                IsDelivered: false,
                Email: mgr.Email,
                Template: `<p>Dear ${mgr.FirstName} <br/></p>
        <p>Evaluations are due for the following direct reports.</p>

        <br/>
        ${empTable}
        <br/>
        <p>To view details, click here.</p>
        <br/>
        <p>Thank you,<br/>
        OPAssess Admin</p>`,
                Company: _currentEvaluation.Company,
                Subject: `Evaluation Period ending on ${evalStartEndDates.end}`
            });

        });

    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
}

task.NotifyEvaluationPeriodEndingOnTS = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodEndingOnEM');
    // const _empMgrs = await UserRepo.find({ 'SelectedRoles': "EM" });
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    }).populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    var evalCompletedStatusIds = await statuses.find({ 'Status': 'Evaluation Complete' });
    evalCompletedStatusIds = evalCompletedStatusIds.map(x => mongoose.Types.ObjectId(x));
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);

    for (let subscribedOrg of subscribedOrgs) {
        const _empMgrs = await UserRepo.find({ 'SelectedRoles': "TS", 'Organization': ObjectId(subscribedOrg._id) });
        var emps = [];
        var pendingEvaluations = await EvaluationRepo.find({
            $and: [{
                "Employees": {
                    $elemMatch: {
                        Status: {
                            $nin: evalCompletedStatusIds
                        }
                    }
                }
            }, { 'Company': mongoose.Types.ObjectId(subscribedOrg._id) }]
        }).populate('Company Employees._id Employees.Status Employees.Peers.EmployeeId Employees.DirectReportees.EmployeeId CreatedBy').sort({ CreatedDate: -1 })

        for (let pendingEvaluation of pendingEvaluations) {
            var evalStartEndDates = await util.getOrganizationStartAndEndDates(pendingEvaluation.Company);
            var now = moment(); //todays date
            var end = moment(evalStartEndDates.end); // another date
            var duration = moment.duration(now.diff(end));
            var days = duration.asDays();
            var period = null;
            console.log(days)
            switch (days) {
                case 30:
                    period = ' a month ';
                    break;
                case 21:
                    period = ' 3 weeks ';
                    break;
                case 7:
                    period = ' 1 week ';
                    break;
                case 3:
                    period = ' 3 days ';
                    break;
                case 0:
                    period = ' 0 days ';
                    break;
                default:
                    break;
            }
            if (period) {
                // const _EA_users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(pendingEvaluation.Company._id) }, { 'Role': 'EA' }] })
                pendingEvaluation.Employees = Employees;
                var _emps = pendingEvaluation.Employees.map(x => x._id);
                emps.push(_emps);
            }
        }
        _empMgrs.map(mgr => {
            var empTable = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
    <thead>
        <th>
            Name
        </th>
        <th>
            Email
        </th>
        <th>
            Evaluation Status
        </th>
    </thead>`;

            for (let emp of emps) {

                if (emp._id.ThirdSignatory.toString() == mgr._id.toString()) {
                    var manager = mgr;
                    empTable = `${empTable} 
        <tr>
        <td>
        ${emp._id.FirstName} ${emp._id.LastName}
        </td>
        <td>
        ${emp._id.Email}
        </td>
        <td>
        ${emp.Status.Status}
        </td>
        </tr>`;
                }
            }
            empTable = empTable + ` </table></p>`;
            _deliveremails.push({
                User: mgr._id,
                Type: 'generic',
                IsDelivered: false,
                Email: mgr.Email,
                Template: `<p>Dear ${mgr.FirstName} <br/></p>
        <p>Evaluations are due for the following employees.</p>

        <br/>
        ${empTable}
        <br/>
        <p>To view details, click here.</p>
        <br/>
        <p>Thank you,<br/>
        OPAssess Admin</p>`,
                Company: _currentEvaluation.Company,
                Subject: `Evaluation Period ending on ${evalStartEndDates.end}`
            });

        });

    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
}

task.NotifyEvaluationPeriodStartedNoEvaluations = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyEvaluationPeriodIsStartingSoon');
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    });
    var subscribedOrgsIds = subscribedOrgs.map(x => x.Organization);
    for (let subscribedOrgsId of subscribedOrgsIds) {
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(subscribedOrgsId);
        var now = moment(); //todays date
        var end = moment(evalStartEndDates.start); // another date
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)

        if (days >= 15) {
            var evaluationsRolledout = await EvaluationRepo.find({ 'Company': mongoose.Types.ObjectId(subscribedOrgsId) });
            if (evaluationsRolledout.length == 0) {
                const _EA_users = await UserRepo.find({ $and: [{ Organization: mongoose.Types.ObjectId(subscribedOrgsId) }, { 'Role': 'EA' }] })
                for (let index = 0; index < _EA_users.length; index++) {
                    _deliveremails.push({
                        User: _EA_users[index],
                        Type: 'generic',
                        IsDelivered: true,
                        Email: _EA_users[index].Email,
                        Template: `<p>Dear ${_EA_users[index].FirstName} <br/></p>
                                <p>The evaluation period for your organization started on ${evalStartEndDates.start}, but no evaluations have been rolled-out yet..

                                <br/><br/>
                                <p>To roll-out evaluations, click here.</p>
                                <br/><br/>
                                <p>Kindly ignore if evaluations have been rolled-out.</p>
                                <br/>
                                <p>Thank you,<br/>
                                ${appConfig.ProductName}</p>`,
                        Company: _EA_users.Organization,
                        Subject: 'Evaluation Period has started, but no evaluations have been rolled-out'
                    });
                }
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};


task.NotifyMonthlyPaymentDueOn = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyMonthlyPaymentDueOn');
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var orgsWithMonthlyPayments = await PaymentReleasesSchema.find({
        'isAnnualPayment': false, 'Status': 'Complete'
    });
    // var orgsWithMonthlyPayments = payments.map(x => x.Organization);
    for (let orgsWithMonthlyPayment of orgsWithMonthlyPayments) {
        var now = moment(); //todays date
        var end = moment(orgsWithMonthlyPayments.ActivationDate); // another date
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)
        switch (days) {
            case 30:
                period = ' 0 days ';
                break;
            case 23:
                period = ' 1 week ';
                break;
            case 27:
                period = ' 3 days ';
                break;
            default:
                break;
        }
        if (period) {
            const user = await UserRepo.findOne({ $and: [{ Organization: mongoose.Types.ObjectId(orgsWithMonthlyPayments.Organization) }, { 'Role': 'CSA' }] })
            for (let index = 0; index < _EA_users.length; index++) {
                _deliveremails.push({
                    User: _EA_users[index],
                    Type: 'generic',
                    IsDelivered: true,
                    Email: _EA_users[index].Email,
                    Template: `<p>Dear ${_EA_users[index].FirstName} <br/></p>
                                <p>Your monthly payment for the current license are due on ${moment(orgsWithMonthlyPayments.ActivationDate).add(1, "month").startOf("day").toDate()}. Click here to make the payment.</a>.

                                <br/></p>
                                <p><br/>Kindly ignore if the payment has been made.</p>
                                <br/>
                                <p>Thank you,<br/>
                                 ${appConfig.ProductName} Administrator</p>`,
                    Company: _EA_users.Organization,
                    Subject: `Monthly Payment Due On ${moment(orgsWithMonthlyPayments.ActivationDate).add(1, "month").startOf("day").toDate()}`
                });
            }
        }
    }
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.NotifyMonthlyPaymentsMissed = async (configType) => {
    var _deliveremails = [];
    console.log('came into NotifyMonthlyPaymentDueOn');
    // var clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations(configType);
    var orgsWithMonthlyPayments = await PaymentReleasesSchema.find({
        'isAnnualPayment': false, 'Status': 'Complete'
    }).populate('Organization');
    var table = `<p><table style="margin:20px 0px;" width="100%" border="2px" cellspacing="0" cellpadding="0">
    <thead>
        <th>
            Organization Name
        </th>
        <th>
            Contact Person
        </th>
        <th>
            Number
        </th>
        <th>
            Email
        </th>
        <th>
            Monthly Payment Date			
        </th>
        <th>
            Evaluation Period
        </th>
        <th>
            Start Date
        </th>
        <th>
            Override Price?
        </th>
    </thead>`;
    // var orgsWithMonthlyPayments = payments.map(x => x.Organization);
    for (let orgsWithMonthlyPayment of orgsWithMonthlyPayments) {
        var now = moment(); //todays date
        var end = moment(orgsWithMonthlyPayments.ActivationDate); // another date
        var duration = moment.duration(now.diff(end));
        var days = duration.asDays();
        var period = null;
        console.log(days)
        if (days > 30) {
            var evalStartEndDates = await util.getOrganizationStartAndEndDates(orgsWithMonthlyPayments.Organization._id);
            table = `${table} 
        <tr>
            <td>
                ${orgsWithMonthlyPayments.Organization.Name}
            </td>
            <td>
                ${orgsWithMonthlyPayments.Organization.ContactPersonFirstName} ${orgsWithMonthlyPayments.Organization.ContactPersonLastName}
            </td>
            <td>
                ${orgsWithMonthlyPayments.Organization.Phone}
            </td>
            <td>
                ${orgsWithMonthlyPayments.Organization.Email}
            </td>
            <td>
                ${moment(orgsWithMonthlyPayments.ActivationDate).add(1, "month").startOf("day").toDate()}
            </td>
            <td>
                ${orgsWithMonthlyPayments.Organization.EvaluationPeriod}
            </td>
            <td>
                ${evalStartEndDates.start}
            </td>
            <td>
                Override
            </td>
        </tr>`;
        }
    }
    const user = await UserRepo.findOne({ 'Role': 'PSA' })
    _deliveremails.push({
        User: user,
        Type: 'generic',
        IsDelivered: true,
        Email: user.Email,
        Template: `<p>Dear ${user.FirstName} <br/></p>
                    <p>Monthly payments for the following clients have been missed.<br/></p>
                    <p><br/>${table}</p>
                    <p><br/>To view details, click here.</p>
                    <br/>
                    <p>Thank you,<br/>
                     ${appConfig.ProductName} Administrator</p>`,
        Company: user.Organization,
        Subject: `Monthly Payments Missed`
    });
    var de = await DeliverEmailRepo.insertMany(_deliveremails);
    console.log('mails :::', _deliveremails);
    console.log("=================================end");
};

task.rolloutPGsAsEvaluations = async (configType) => {
    var _deliveremails = [];
    console.log('came into rolloutPGsAsEvaluations');
    var subscribedOrgs = await subscriptions.find({
        ActivatedOn: { $lt: moment().add(1, "day").endOf("day").toDate() }
    }).populate('Organization');
    var subscribedOrgs = subscribedOrgs.map(x => x.Organization);
    for (let subscribedOrg of subscribedOrgs) {
        var clientsWithSpecificConfig = await clientconfigurations.find({ 'ConfigKey': 'PG-Evaluation-RollOut', 'Organization': { $eq: mongoose.Types.ObjectId(subscribedOrg._id) } });
        console.log(`clientsWithSpecificConfig :  ${subscribedOrg._id} ${typeof clientsWithSpecificConfig}`);
        console.log(clientsWithSpecificConfig);
        if (clientsWithSpecificConfig && clientsWithSpecificConfig.length > 0) {
            // clientsWithSpecificConfig = await task.findOrgsWithSpecificConfigurations('PG-SIGNOFF');
        // }
        var evalStartEndDates = await util.getOrganizationStartAndEndDates(subscribedOrg._id);
        var now = moment(); //todays date
        var end = moment(evalStartEndDates.end); // another date
        var duration = moment.duration(end.diff(now));
        var days = duration.asDays();
        console.log(`today : ${now}  startDate:${evalStartEndDates.start} endDate:${end} orgId : ${subscribedOrg.Name}`);
        console.log(`days :  ${Math.ceil(days)} ${clientsWithSpecificConfig[0].ActivateWithin}`)

        if (clientsWithSpecificConfig[0].ActivateWithin >= Math.ceil(days)) {
            console.log(`inside client specific ${subscribedOrg._id}`);
        // if (true) {
            var pgsToRollOut = await kpiform.aggregate([
                {
                    $match: {
                        'Company': mongoose.Types.ObjectId(subscribedOrg._id)
                    }
                },
                {
                    $lookup: {
                        from: "evalutions",
                        localField: "EmployeeId",
                        foreignField: "Employees._id",
                        as: "evaluation"
                    }
                }
            ])
            console.log(' pgsToRollOut : ', pgsToRollOut);
            for (let pg of pgsToRollOut) {
                if (pg.evaluation.length == 0) {
                    var user = await UserRepo.findOne({ '_id': mongoose.Types.ObjectId(pg.EmployeeId) }).populate('Manager');
                    var manager = await UserRepo.findOne({ '_id': mongoose.Types.ObjectId(pg.EmployeeId) }).populate('Manager');
                    delete user.Password;
                    delete user.Manager.Password;
                    var requestObj = {};
                    var Employees = [];
                    Employees.push(user);
                    requestObj['Employees'] = Employees;
                    requestObj['EvaluationPeriod'] = subscribedOrg.EvaluationPeriod;
                    requestObj['EvaluationDuration'] = pg.EvaluationDuration;
                    requestObj['Model'] = subscribedOrg.EvaluationModels[0];
                    requestObj['PeerRatingNeeded'] = false;
                    requestObj['ActivateKPI'] = false;
                    requestObj['ActivateActionPlan'] = false;
                    requestObj['KPIFor'] = "Employee";
                    requestObj['CreatedBy'] = subscribedOrg.Admin;
                    requestObj['Company'] = subscribedOrg._id;
                    requestObj['EvaluationType'] = pg.EvaluationType;
                    requestObj['EvaluationPeriodText'] = "Jan'21 To Dec'21";

                    console.log('rollout evaluation for : ', JSON.stringify(requestObj));
                    const { body } = await got.post('http://localhost:3000/api/evaluation/CreateEvaluation', {
                        json: requestObj,
                        responseType: 'json'
                    });
                    console.log("=== RESPONSE===")
                    console.log(body);
                    console.log("====END====")
                }

            }
        }
    }
    }
    console.log("=================================end");
};



module.exports = task;