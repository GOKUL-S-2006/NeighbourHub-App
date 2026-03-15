
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [/dist\/.*/];

module.exports = config;

module.exports = config;