"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPost = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// src/api/post.js
var API = _axios["default"].create({
  baseURL: "http://192.168.56.1:5000/api",
  // your local IP
  headers: {
    "Content-Type": "application/json"
  }
});

var createPost = function createPost(data) {
  return regeneratorRuntime.async(function createPost$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", API.post("/posts", data));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
};

exports.createPost = createPost;