'use strict';

const util = require('../util');
const wrapCallback = require('../common').wrapCallback;

function patchUse(router) {
  const originalUse = router.use;
  return function (path, fn) {
    if (util.isFunction(path)) {
      return originalUse.call(router, wrapCallback(path));
    }

    return originalUse.call(router, path, wrapCallback(fn));
  };
}

module.exports = patchUse;
