//var UserManager = require("./Repos/UserManager.js");
var mongoose = require("mongoose");
require('./model/User')
require('./model/Packages')
var SendMail = require("./helpers/mail.js");
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
    // var expiredList= await User.find({'packageId.expireat':{$lte:new Date()}});
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
module.exports = task;