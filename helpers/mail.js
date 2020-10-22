//var common = require('./common.js');
var nodemailer = require('nodemailer');
var env = process.env.NODE_ENV || "dev";
var config = require(`../config/${env}.config`);

var smtpConfig = {
    host: 'smtp.zoho.com', //config.smtp2.host,
    port: '587',//config.smtp2.port,
    secure: false, // use SSL
    auth: {
        user: config.smtp2.auth.user,
        pass: config.smtp2.auth.pass
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false

    }
}
console.log('smtpConfig',smtpConfig)

let transporter = nodemailer.createTransport(smtpConfig);

exports.GetMailObject = function (to, subject, html, cc, bcc) {
console.log('getmailobj',{ to,subject,html})
    function MailException(message) {
        this.message = message;
        this.name = 'MailException';
    }

    var mailObject = {};

    if (to && to !="")
    {
        if(env==='dev'){
            mailObject.to = ['ksamba@innoclique.com']
        }else{
            mailObject.to = to;
        }
    }
    else
        throw new MailException("To filed is maindatory");

    if (subject)
        mailObject.subject = subject;
    else
        throw new MailException("Subject is maindatory");

    if (html)
        mailObject.html = html;
    else
        throw new MailException("Body is maindatory");

    if (cc)
        mailObject.cc = cc;

    if (bcc)
        mailObject.bcc = bcc;
console.log('mailobject',mailObject)
    return mailObject;
}

exports.sendEmail = function (contents, cb) {
    console.log('sendemail',smtpConfig)
    // contents.from = "noreply@yovza.com";
    contents.from = config.smtp2.smtp_user; // "vishal.test123456@gmail.com";
    return transporter.sendMail(contents, function (error, info) {
        if (error) {
            console.log('error',error);
            cb({
                mailsuccess: false,
                data: null
            });
        } else
            cb({
                mailsuccess: true,
                data: info
            });
    });
}