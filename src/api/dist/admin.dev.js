"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateIssueStatus = exports.getAdminIssues = void 0;

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// GET ALL ISSUES (ADMIN)
var getAdminIssues = function getAdminIssues() {
  var response;
  return regeneratorRuntime.async(function getAdminIssues$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_api["default"].get("/admin/issues"));

        case 2:
          response = _context.sent;
          return _context.abrupt("return", response.data);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}; // UPDATE ISSUE STATUS


exports.getAdminIssues = getAdminIssues;

var updateIssueStatus = function updateIssueStatus(id, status) {
  var response;
  return regeneratorRuntime.async(function updateIssueStatus$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(_api["default"].put("/admin/issues/".concat(id), {
            status: status
          }));

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

exports.updateIssueStatus = updateIssueStatus;