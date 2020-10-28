
const cron = require("node-cron");
const express = require("express");
var process = require('process');
var mongoose = require('mongoose');
console.log('starting...')
var app = express();
var env = process.env.NODE_ENV || 'dev';
var config = require('./config/' + env + '.config');
var task=require('./Tasks');

//var common = require('./helpers/common')(config);

console.log(config);
console.log(env);

// cron.schedule("* * * * *",async () => {  
//  // var ff=await task.GetUserCount();
//   //var expi=await task.GetPackageExpiredUsers()
//   var gg=await task.NotifyEvaluationToEmployees();
//   // console.log('expi',expi)
//   // console.log('total users count',ff)
//   console.log(`this message logs every minute`);
// });
//0 23 * * *
cron.schedule("* * * * *",async () => {  
    // var ff=await task.GetUserCount();
     //var expi=await task.GetPackageExpiredUsers()
     var gg=await task.NotifyToCSAOnLicenseExpiry();
     // console.log('expi',expi)
     // console.log('total users count',ff)
     console.log(`this message logs every minute`);
   });
 // var ff=await task.GetUserCount();
  //var expi=await task.GetPackageExpiredUsers()
  //var gg=await task.NotifyEvaluationToEmployees();
  var ff=await task.FindAboutToExpireCompanies();
  console.log('ffff',ff);
  // console.log('expi',expi)
  // console.log('total users count',ff)
  console.log(`this message logs every minute`);
});
mongoose.Promise = global.Promise;
var mongoPromise = mongoose.connect(config.database, {
    
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoPromise.then(
    (client) => {        
        console.log('Connected to Database', config.database);         
    },
    err => {
        console.log('error', err);
        try { console.log(JSON.stringify(err)); }
         catch (dberr) { console.log(dberr); }
        return;
    }
);



app.listen(config.port, function () {
  console.log('App Listening at port : ' + config.port);
});

