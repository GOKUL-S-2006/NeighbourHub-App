"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateIssue = exports.deleteIssue = exports.upvoteIssue = exports.createIssue = exports.updateStatus = exports.getMyIssues = exports.adminDeleteIssue = exports.adminUpdateStatus = exports.getAdminStats = exports.getAdminIssues = exports.getIssues = void 0;

var _api = _interopRequireDefault(require("./api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getIssues = function getIssues() {
  var res;
  return regeneratorRuntime.async(function getIssues$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(_api["default"].get("/issues"));

        case 2:
          res = _context.sent;
          return _context.abrupt("return", res.data);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}; // ─── ADMIN ROUTES ─────────────────────────────────────


exports.getIssues = getIssues;

var getAdminIssues = function getAdminIssues() {
  var page,
      limit,
      filters,
      params,
      res,
      _args2 = arguments;
  return regeneratorRuntime.async(function getAdminIssues$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          page = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : 1;
          limit = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 10;
          filters = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};
          params = new URLSearchParams(_objectSpread({
            page: page,
            limit: limit
          }, filters)).toString();
          _context2.next = 6;
          return regeneratorRuntime.awrap(_api["default"].get("/admin/issues?".concat(params)));

        case 6:
          res = _context2.sent;
          return _context2.abrupt("return", res.data);

        case 8:
        case "end":
          return _context2.stop();
      }
    }
  });
};

exports.getAdminIssues = getAdminIssues;

var getAdminStats = function getAdminStats() {
  var res;
  return regeneratorRuntime.async(function getAdminStats$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(_api["default"].get("/admin/dashboard"));

        case 2:
          res = _context3.sent;
          return _context3.abrupt("return", res.data);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
};

exports.getAdminStats = getAdminStats;

var adminUpdateStatus = function adminUpdateStatus(id, status) {
  var res;
  return regeneratorRuntime.async(function adminUpdateStatus$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(_api["default"].patch("/admin/issues/".concat(id, "/status"), {
            status: status
          }));

        case 2:
          res = _context4.sent;
          return _context4.abrupt("return", res.data);

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
};

exports.adminUpdateStatus = adminUpdateStatus;

var adminDeleteIssue = function adminDeleteIssue(id) {
  var res;
  return regeneratorRuntime.async(function adminDeleteIssue$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(_api["default"]["delete"]("/admin/issues/".concat(id)));

        case 2:
          res = _context5.sent;
          return _context5.abrupt("return", res.data);

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  });
};

exports.adminDeleteIssue = adminDeleteIssue;

var getMyIssues = function getMyIssues() {
  var res;
  return regeneratorRuntime.async(function getMyIssues$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(_api["default"].get("/issues/my"));

        case 2:
          res = _context6.sent;
          return _context6.abrupt("return", res.data);

        case 4:
        case "end":
          return _context6.stop();
      }
    }
  });
};

exports.getMyIssues = getMyIssues;

var updateStatus = function updateStatus(id, status) {
  var res;
  return regeneratorRuntime.async(function updateStatus$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(_api["default"].patch("/issues/".concat(id, "/status"), {
            status: status
          }));

        case 2:
          res = _context7.sent;
          return _context7.abrupt("return", res.data);

        case 4:
        case "end":
          return _context7.stop();
      }
    }
  });
};

exports.updateStatus = updateStatus;

var createIssue = function createIssue(data) {
  var res;
  return regeneratorRuntime.async(function createIssue$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return regeneratorRuntime.awrap(_api["default"].post("/issues", data));

        case 2:
          res = _context8.sent;
          return _context8.abrupt("return", res.data);

        case 4:
        case "end":
          return _context8.stop();
      }
    }
  });
};

exports.createIssue = createIssue;

var upvoteIssue = function upvoteIssue(issueId) {
  var res;
  return regeneratorRuntime.async(function upvoteIssue$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return regeneratorRuntime.awrap(_api["default"].patch("/issues/".concat(issueId, "/upvote"), {}));

        case 2:
          res = _context9.sent;
          return _context9.abrupt("return", res.data);

        case 4:
        case "end":
          return _context9.stop();
      }
    }
  });
};

exports.upvoteIssue = upvoteIssue;

var deleteIssue = function deleteIssue(id) {
  var res;
  return regeneratorRuntime.async(function deleteIssue$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.next = 2;
          return regeneratorRuntime.awrap(_api["default"]["delete"]("/issues/".concat(id)));

        case 2:
          res = _context10.sent;
          return _context10.abrupt("return", res.data);

        case 4:
        case "end":
          return _context10.stop();
      }
    }
  });
};

exports.deleteIssue = deleteIssue;

var updateIssue = function updateIssue(id, data) {
  var res;
  return regeneratorRuntime.async(function updateIssue$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.next = 2;
          return regeneratorRuntime.awrap(_api["default"].put("/issues/".concat(id), data));

        case 2:
          res = _context11.sent;
          return _context11.abrupt("return", res.data);

        case 4:
        case "end":
          return _context11.stop();
      }
    }
  });
};

exports.updateIssue = updateIssue;