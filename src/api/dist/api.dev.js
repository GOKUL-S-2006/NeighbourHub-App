"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// ⚠️ Use your local IP, NOT localhost
// Example: http://192.168.1.5:5000
var API = _axios["default"].create({
  baseURL: "http://172.16.190.133:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
});

var _default = API;
exports["default"] = _default;