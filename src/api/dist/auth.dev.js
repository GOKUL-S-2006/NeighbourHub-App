"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loginUser = exports.registerUser = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// src/api/auth.js
var API = _axios["default"].create({
  baseURL: "http://10.104.77.133:5000/api",
  // <-- your IP
  headers: {
    "Content-Type": "application/json"
  }
}); // ✅ SIGNUP


var registerUser = function registerUser(data) {
  return API.post("/auth/signup", data);
}; // ✅ LOGIN


exports.registerUser = registerUser;

var loginUser = function loginUser(data) {
  return API.post("/auth/login", data);
};

exports.loginUser = loginUser;