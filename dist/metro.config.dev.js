"use strict";

// metro.config.js (in your project root)
var _require = require("expo/metro-config"),
    getDefaultConfig = _require.getDefaultConfig;

var config = getDefaultConfig(__dirname);
config.resolver.blockList = [/dist\/.*/];
module.exports = config;