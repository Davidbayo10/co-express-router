'use strict';

const co = require('co');
const util = require('./util');
const EXPRESS_ITEMS = require('./enums').EXPRESS_ITEMS;

module.exports = (callback) => {
  const wrappedCallback = co.wrap(callback);

  function isFirstArgumentError(err) {
    return util.isError(err);
  }

  function isCallbackErrorHandler(callback) {
    return isFirstArgumentError.call(callback);
  }

  function wrapCallbackParam(req, res, next, value) {
    wrappedCallback(req, res, next, value).catch(next);
  }

  function wrapCallback() {
    // check if first argument is an error to find out if it's error-handling middleware
    if (isCallbackErrorHandler(callback)) {
      return (err, req, res, next) => {
        wrappedCallback(err, req, res, next).catch(next);
      };
    }

    return (req, res, next) => {
      wrappedCallback(req, res, next).catch(next);
    };
  }

  function getWrappedCallback(type) {
    switch (type) {
      case EXPRESS_ITEMS.PARAM:
        return wrapCallbackParam;
        break;
      default:
        return wrapCallback();
        break;
    }
  }

  return getWrappedCallback;
};
