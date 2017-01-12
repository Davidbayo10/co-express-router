'use strict';

exports.isString = function (obj) {
  return typeof obj === 'string';
};

exports.isFunction = function (fn) {
  return typeof fn === 'function';
};

exports.flatten = function flatten(arr, ret) {
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
