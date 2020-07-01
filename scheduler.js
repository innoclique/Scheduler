
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

cron.schedule("* * * * *",async () => {  
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

