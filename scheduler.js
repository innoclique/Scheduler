
const cron = require("node-cron");
const express = require("express");
console.log('starting...')
var app = express();
cron.schedule("* * * * *", () => {
  console.log(`this message logs every minute`);
});

app.listen(2222);