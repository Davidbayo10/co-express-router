'use strict';

const Router = require('express').Router;
const patchers = require('./patchers');

function isAppObj(obj) {
  return typeof obj.lazyrouter === 'function';
}

function patch(router) {
  router = router || new Router();
  if (isAppObj(router)) {
    const app = router;
    app.lazyrouter();
    router = app._router;
  }

  router = patchers(router);  
  return router;
}

module.exports = patch;
