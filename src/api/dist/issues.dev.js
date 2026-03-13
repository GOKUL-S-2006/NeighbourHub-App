"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllIssues = exports.createIssue = void 0;

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// CREATE ISSUE
var createIssue = function createIssue(issueData) {
  var response;
  return regeneratorRuntime.async(function createIssue$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_api["default"].post("/issues", issueData));

        case 2:
          response = _context.sent;
          return _context.abrupt("return", response.data);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}; // GET ALL ISSUES


exports.createIssue = createIssue;

var getAllIssues = function getAllIssues() {
  var response;
  return regeneratorRuntime.async(function getAllIssues$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(_api["default"].get("/issues"));

        case 2:
          response = _context2.sent;
          return _context2.abrupt("return", response.data);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
};

exports.getAllIssues = getAllIssues;