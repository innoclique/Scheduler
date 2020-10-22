const Express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");

const NavigationSchema = new mongoose.Schema({

    "url": {
        "type": "String"
      },
      "name": {
        "type": "String"
      },
      "code": {
        "type": "String"
      },
      "icon": {
        "type": "String"
      },
      "badge": {
        "variant": {
          "type": "String"
        },
        "text": {
          "type": "String"
        }
      },
      "linkProps": {
        "routerLinkActive": {
          "type": "String"
        }
      },
      "isactive": {
        "type": "Boolean"
      }
    
});

NavigationSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model("Navigations", NavigationSchema);