//var UserManager = require("./Repos/UserManager.js");
var mongoose = require("mongoose");
require('./model/User')
require('./model/Packages')
const Mongoose = require("mongoose");
var fs = require("fs");
const EvaluationRepo = require('./model/Evalution');
const DeliverEmailRepo = require('./model/DeliverEmail');
const UserRepo = require('./model/UserSchema');
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
    var list = await DeliverEmailRepo.find({ IsDelivered: false,Email:{$ne:null} })
        .populate('User._id')
        .sort({ CreatedOn: -1 })
        console.log('count',list.length)
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
const _user=await UserRepo.findOne({_id:mongoose.Types.ObjectId(element.User)})
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
                    null,null
                );
               // console.log('mail',mailObject);
                SendMail.sendEmail(mailObject, async function (res) {
                    console.log(res);
                    await DeliverEmailRepo.update({_id:element._id},{IsDelivered:true})
                });
        
            });
       
    }
}
module.exports = task;