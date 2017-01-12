'use strict';

const routePatcher = require('./route');
const usePatcher = require('./use');
const paramPatcher = require('./param');

module.exports = function (router) {
  router.route = routePatcher(router);
  router.use = usePatcher(router);
  router.param = paramPatcher(router);
  return router;
};
