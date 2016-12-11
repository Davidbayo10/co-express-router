'use strict';
const co = require('co');
const methods = require('methods');
const Router = require('express').Router;

function isAppObj(obj) {
  return typeof obj.lazyrouter === 'function';
}

function isGenerator(f) {
  return typeof f === 'function' && Object.getPrototypeOf(f) !== Object.getPrototypeOf(Function);
}

function flatten(arr, ret) {
  ret = ret || [];
  for (let elem of arr) {
    if (Array.isArray(elem)) {
      flatten(elem, ret);
    } else {
      ret.push(elem);
    }
  }

  return ret;
};

function wrapCallback(callback, type) {
  if (isGenerator(callback)) {
    const callbackWrapped = co.wrap(callback);
    if (type === 'param') {
      return function (req, res, next, value) {
        callbackWrapped(req, res, next, value).catch(next);
      };
    }

    if (type === 'use') {
      // check callback arity to find out if it's error-handling middleware
      if (callback.length > 3) {
        return function (err, req, res, next) {
          callbackWrapped(err, req, res, next).catch(err);
        };
      }

      return function (req, res, next) {
        callbackWrapped(req, res, next).catch(next);
      };
    }
  }

  return callback;
}

function callbackToWrap(callback) {
  return wrapCallback(callback, 'use');
}

function applyMethodsToRoute(route) {
  return function (method) {
    const f = route[method];
    route[method] = function () {
      const callbacks = flatten([].slice.call(arguments, 0)).map(callbackToWrap);
      return f.apply(route, callbacks);
    };
  };
}

function patchRoute(router) {
  const originalRoute = router.route;
  return function route(path) {
    const route = originalRoute.call(router, path);
    const allMethods = methods.concat('all');
    allMethods.forEach(applyMethodsToRoute(route));
    return route;
  };
}

function patchUse(router) {
  const originalUse = router.use;
  return function (path, fn) {
    if (typeof path === 'function') {
      return originalUse.call(router, wrapCallback(path, 'use'));
    }

    return originalUse.call(router, path, wrapCallback(fn, 'use'));
  };
}

function patchParam(router) {
  const originalParam = router.param;
  return function (name, fn) {
    // only get involved when the first parameter is a string and the second is a callable
    if (typeof name === 'string' && typeof fn === 'function') {
      return originalParam.call(router, name, wrapCallback(fn, 'param'));
    }

    return originalParam.apply(router, [].slice.call(arguments, 0));
  };
}

function patch(router) {
  router = router || new Router();
  if (isAppObj(router)) {
    const app = router;
    app.lazyrouter();
    router = app._router;
  }

  router.route = patchRoute(router);
  router.use = patchUse(router);
  router.param = patchParam(router);
  return router;
}

module.exports = patch;
