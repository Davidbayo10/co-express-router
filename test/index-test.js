'use strict';
const express = require('express');
const supertest = require('supertest-as-promised');
require('jasmine-co').install();

function asyncText(err, text, cb) {
  setImmediate(function() {
    cb(err, text);
  });
}

function thunk(err, text) {
  return function(cb) {
    asyncText(err, text, cb);
  };
}

describe('co-express-router', function () {
  let app;
  let request;

  beforeEach(function () {
    app = express();
    require('../index.js')(app);
    request = supertest.agent(app);
  });

  it('supports a single generator route', function* () {
    const text = 'works';
    app.get('/', function* (req, res) {
      res.send(text);
    });

    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.text).toBe(text);
  });

  it('supports multiple generator routes', function* () {
    app.get('/', function* (req, res, next) {
      req.val = yield thunk(null, 'thunk');
      next();
    }, function* (req, res, next) {
      req.val += yield thunk(null, 'thunk');
      next();
    }, function* (req, res) {
      res.send(req.val + 'func');
    });

    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
  });

  it('doesn\'t alter application object', function* () {
    app.get('/', function* (req, res, next) {
      res.send('it works!');
    });

    app.set('it', 'works!');

    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.text).toBe('it works!');
    expect(app.get('it')).toBe('works!');
  });

  it('supports error routes', function* () {
    app.get('/', function* (req, res, next) {
      const val = yield thunk(new Error('thunk error'));
      res.send(val);
    });

    app.use(function (err, req, res, next) {
      if (err && err.message === 'thunk error') {
        res.send('caught');
      } else {
        next(err);
      }
    });

    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.text).toBe('caught');
  });

  it('supports app.route()', function* () {
    const books = app.route('/books');

    books.get(function* (req, res, next) {
      req.val = yield thunk(null, 'thunk');
      next();
    }, function* (req, res, next) {
      req.val += yield thunk(null, 'thunk');
      next();
    }, function* (req, res) {
      res.send(req.val + 'func');
    });


    const res = yield request.get('/books').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.text).toBe('thunkthunkfunc');
  });

  it('supports express Router', function* () {
    const router = new express.Router();
    require('../index.js')(router);
    const text = 'works';
    router.get('/', function* (req, res) {
      res.send(text);
    });

    app.use(router);
    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.text).toBe(text);
  });

  it('supports co-express Router', function* () {
    const router = require('../index.js')();
    const text = 'works';
    router.get('/', function* (req, res) {
      res.send(text);
    });

    app.use(router);
    const res = yield request.get('/').toPromise();
    expect(res).toBeTruthy();
    expect(res.status).toBe(200);
    expect(res.text).toBe(text);
  });
});
