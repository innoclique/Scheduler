const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const { boolean } = require("joi");

const UserAppSettings = new mongoose.Schema({
    User:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    NavigationMenu:{},
    
    
});

UserAppSettings.set('toJSON', { versionKey: false });

module.exports = mongoose.model("UserAppSettings", UserAppSettings);