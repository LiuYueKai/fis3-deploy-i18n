'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _forEach2 = require('lodash/forEach');

var _forEach3 = _interopRequireDefault(_forEach2);

var _cloneDeep2 = require('lodash/cloneDeep');

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _merge3 = require('lodash/merge');

var _merge4 = _interopRequireDefault(_merge3);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _isGlob = require('is-glob');

var _isGlob2 = _interopRequireDefault(_isGlob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (pattern) {
  var cwd = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : process.cwd();
  var defaultLangName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var onFileParse = arguments[3];
  var init = arguments[4];

  var result = (0, _isPlainObject3.default)(init) && !(0, _isEmpty3.default)(init) ? (0, _cloneDeep3.default)(init) : {};

  if ((0, _isGlob2.default)(pattern)) {
    var i18nFiles = _glob2.default.sync(pattern, {
      cwd: cwd
    });

    (0, _forEach3.default)(i18nFiles, function (filePath) {
      var fileAbsolutePath = _path2.default.join(cwd, filePath);
      var filePathParse = _path2.default.parse(fileAbsolutePath);
      var fileName = filePathParse.name;
      var fileJSON = null;
      try {
        fileJSON = JSON.parse(_fs2.default.readFileSync(fileAbsolutePath, 'utf8'));
      } catch (err) {
        console.error('\nPlugin(fis3-deploy-i18n-ejs/utils/compileFileToI18nData) Error:\n' + err + '\n        ');
      }

      (0, _merge4.default)(result, (0, _defineProperty3.default)({}, fileName, !(0, _isFunction3.default)(onFileParse) ? fileJSON : onFileParse(fileJSON, defaultLangName, fileName)));
    });
  }

  return result;
};

module.exports = exports['default'];