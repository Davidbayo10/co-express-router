'use strict';

const isGenerator = require('is-generator').fn;
const wrapper = require('./wrapper');

exports.wrapCallback = function (callback, type) {
  if (!isGenerator(callback)) {
    return callback;
  }

  const wrappedCallback = wrapper(callback);
  return wrappedCallback(type);
};
