'use strict';

const methods = require('methods');
const flatten = require('../util').flatten;
const wrapCallback = require('../common').wrapCallback;

function applyMethodsToRoute(route) {
  return function (method) {
    const f = route[method];
    route[method] = function () {
      const array = [].slice.call(arguments, 0);
      const callbacks = flatten(array).map(wrapCallback);
      return f.apply(route, callbacks);
    };
  };
}

function patchRoute(router) {
  const originalRoute = router.route;
  return function (path) {
    const route = originalRoute.call(router, path);
    const allMethods = methods.concat('all');
    allMethods.forEach(applyMethodsToRoute(route));
    return route;
  };
}

module.exports = patchRoute;
