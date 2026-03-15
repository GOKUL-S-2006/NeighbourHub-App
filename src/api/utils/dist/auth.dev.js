"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCurrentUser = void 0;

var _asyncStorage = _interopRequireDefault(require("@react-native-async-storage/async-storage"));

var _jwtDecode = require("jwt-decode");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var getCurrentUser = function getCurrentUser() {
  var token, decoded;
  return regeneratorRuntime.async(function getCurrentUser$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(_asyncStorage["default"].getItem("token"));

        case 3:
          token = _context.sent;

          if (token) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", null);

        case 6:
          decoded = (0, _jwtDecode.jwtDecode)(token);
          return _context.abrupt("return", {
            id: decoded.id || decoded._id || decoded.userId,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
          });

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.log("Token decode error:", _context.t0);
          return _context.abrupt("return", null);

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
};

exports.getCurrentUser = getCurrentUser;