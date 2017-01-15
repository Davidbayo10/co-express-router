'use strict';

const util = require('../util');
const wrapCallback = require('../common').wrapCallback;

function patchUse(router) {
  const expressUse = router.use;
  return function (path, fn) {
    if (util.isFunction(path)) {
      return expressUse.call(router, wrapCallback(path));
    }

    return expressUse.call(router, path, wrapCallback(fn));
  };
}

module.exports = patchUse;
