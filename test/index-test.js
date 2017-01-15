'use strict';

const co = require('co');
const express = require('express');
const supertest = require('supertest-as-promised');

function thunk(err, text) {
  return new Promise((resolve, reject) => {
    if (err) {
      return reject(err);
    }

    return resolve(text);
  });
}

describe('co-express-router', () => {
  let app;
  let request;

  beforeEach(function () {
    app = express();
    require('../index.js')(app);
    request = supertest.agent(app);
  });

  it('supports a single generator route', done => {
    co(function* () {
      const text = 'works';
      app.get('/', function* (req, res) {
        res.send(text);
      });

      const res = yield request.get('/').toPromise();
      expect(res).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.text).toBe(text);
      done();
    })
    .catch(done);
  });

  it('supports legacy route handler,', done => {
    co(function* () {
      app.get('/', function (req, res, next) {
        req.val = 'thunk';
        next();
      }, function* (req, res, next) {
        req.val += yield thunk(null, 'thunk');
        next();
      }, function (req, res) {
        res.send(req.val + 'func');
      });

      const res = yield request.get('/').toPromise();
      expect(res).toBeTruthy();
      expect(res.status).toBe(200);
      done();
    })
    .catch(done);
  });

  it('supports multiple generator routes', done => {
    co(function* () {
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
      done();
    })
    .catch(done);
  });

  it('doesn\'t alter application object', done => {
    co(function* () {
      app.get('/', function* (req, res) {
        res.send('it works!');
      });

      app.set('it', 'works!');

      const res = yield request.get('/').toPromise();
      expect(res).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.text).toBe('it works!');
      expect(app.get('it')).toBe('works!');
      done();
    })
    .catch(done);
  });

  it('supports error routes', done => {
    co(function* () {
      app.get('/', function* (req, res) {
        const val = yield thunk(new Error('thunk error'));
        res.send(val);
      });

      app.use((err, req, res, next) => {
        if (err && err.message === 'thunk error') {
          res.send('caught');
        } else {
          next(err);
        }
      });

      const res = yield request.get('/').toPromise();
      expect(res).toBeTruthy();
      expect(res.text).toBe('caught');
      done();
    })
    .catch(done);
  });

  it('supports error handlers routes', done => {
    co(function* () {
      app.get('/', function* (req, res) {
        const val = yield thunk(new Error('thunk error'));
        res.send(val);
      });

      app.use((err, req, res, next) => {
        next(err);
      });

      app.use((err, req, res, next) => {
        if (err && err.message === 'thunk error') {
          res.send('caught');
        } else {
          res.end();
        }
      });

      const res = yield request.get('/').toPromise();
      expect(res).toBeTruthy();
      expect(res.text).toBe('caught');
      done();
    })
    .catch(done);
  });

  it('supports app.route()', done => {
    co(function* () {
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
      done();
    })
    .catch(done);
  });

  it('supports app.param()', done => {
    co(function* () {
      const id = 'id';
      app.param('id', function* (req, res, next, id) {
        req.val = yield thunk(null, id);
        next();
      });

      app.get('/:id', (req, res, next) => {
        res.send(req.val);
        next();
      });

      const res = yield request.get(`/${id}`).toPromise();
      expect(res).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.text).toBe('id');
      done();
    })
    .catch(done);
  });

  it('supports express Router', done => {
    co(function* () {
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
      done();
    })
    .catch(done);
  });

  it('supports co-express Router', done => {
    co(function* () {
      const router = require('../index.js')();
      const text = 'works';
      router.get('/co', function* (req, res) {
        res.send(text);
      });

      app.use(router);
      const res = yield request.get('/co').toPromise();
      expect(res).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.text).toBe(text);
      done();
    })
    .catch(done);
  });
});
