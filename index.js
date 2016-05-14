'use strict';
const co = require('co');
const methods = require('methods');

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
	// only wrap callbacks if they are generators
	if (isGenerator(callback)) {
		const coCallback = co.wrap(callback);
		if (type === 'param') {
			return function (req, res, next, value) {
				coCallback(req, res, next, value, function (err) {
					if (err) next(err);
				});
			};
		}

		if (type === 'use') {
			// check callback arity to find out if it's error-handling middleware
			if (callback.length > 3) {
				return function (err, req, res, next) {
					coCallback(err, req, res, next).catch(err);
				};
			} else {
				return function (req, res, next) {
					coCallback(req, res, next).catch(next);
				};
			}
		}
	} else {
		return callback;
	}
}

function patchRoute(router) {
	const originalRoute = router.route;
	return function route(path) {
		const route = originalRoute.call(router, path);
		methods.concat('all').forEach(function (method) {
			const f = route[method];
			route[method] = function () {
				const callbacks = flatten([].slice.call(arguments, 0)).map(function (callback) {
					return wrapCallback(callback, 'use');
				});

				return f.apply(route, callbacks);
			}
		});

		return route;
	};
}

function patchUse(router) {
	const originalUse = router.use;
	return function (path, fn) {
		if (typeof path === 'function') {
			return originalUse.call(router, wrapCallback(path, 'use'));
		} else {
			return originalUse.call(router, path, wrapCallback(fn, 'use'));
		}
	};
}

function patchParam(router) {
	const originalParam = router.param;
	return function (name, fn) {
		// only get involved when the first parameter is a string and the second is a callable
		if (typeof name === 'string' && typeof fn === 'function') {
			return originalParam.call(router, name, wrapCallback(fn, 'param'));
		} else {
			return originalParam.apply(router, [].slice.call(arguments, 0));
		}
	};
}

function patch(router) {
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
