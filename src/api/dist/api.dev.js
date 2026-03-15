"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _asyncStorage = _interopRequireDefault(require("@react-native-async-storage/async-storage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var API = _axios["default"].create({
  baseURL: "http://10.104.77.133:5000/api",
  headers: {
    "Content-Type": "application/json"
  }
}); // ✅ Auto-attach token to every request


API.interceptors.request.use(function _callee(config) {
  var token;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_asyncStorage["default"].getItem("token"));

        case 2:
          token = _context.sent;

          if (token) {
            config.headers.Authorization = "Bearer ".concat(token);
          }

          return _context.abrupt("return", config);

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
});
var _default = API;
exports["default"] = _default;