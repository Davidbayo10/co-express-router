'use strict';

const co = require('co');
const EXPRESS_ITEMS = require('./enums').EXPRESS_ITEMS;

module.exports = (callback) => {
  const argsLength = callback.length;
  const wrappedCallback = co.wrap(callback);

  function wrapCallbackParam(req, res, next, value) {
    wrappedCallback(req, res, next, value).catch(next);
  }

  function getCallbackByArgs(argsLength) {
    // check callback arity to find out if it's error-handling middleware
    if (argsLength > 3) {
      return (err, req, res, next) => {
        wrappedCallback(err, req, res, next).catch(err);
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
        return getCallbackByArgs(argsLength);
        break;
    }
  }

  return getWrappedCallback;
};
