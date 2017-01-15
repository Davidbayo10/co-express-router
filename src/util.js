'use strict';

exports.isString = obj => typeof obj === 'string';

exports.isFunction = fn => typeof fn === 'function';

exports.isError = err => err instanceof Error;

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
