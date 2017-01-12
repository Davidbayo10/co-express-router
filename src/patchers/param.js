'use strict';

const util = require('../util');
const wrapCallback = require('../common').wrapCallback;

function patchParam(router) {
  const originalParam = router.param;
  // only get involved when the first parameter is a string and the second is a callable
  return function (name, fn) {
    if (util.isString(name) && util.isFunction(fn)) {
      return originalParam.call(router, name, wrapCallback(fn, 'param'));
    }

    return originalParam.apply(router, [].slice.call(arguments, 0));
  };
}

module.exports = patchParam;
