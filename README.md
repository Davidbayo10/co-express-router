co-express-router
=================
```co-express-router``` patches [express routers](https://github.com/visionmedia/express) to make them accept generator-based flow-control as middleware, using [co](https://github.com/visionmedia/co).

### Install
```npm install davidbayo10/co-express-router```


## Usage
```co-express-router``` can be used to patch Express 4.x '```app```' objects and routers individually.

```javascript
var express = require('express');
var app = express();

// patch the app
require('co-express-router')(app);
```
```co-express-router``` does not modify the object's prototype. You may also pass a ```Router``` instance to ```co-express-route```.


Patching will enable you to pass generators to ```foo.VERB```, ```foo.use``` and ```foo.param```.
```javascript
app.get('/', function*(req, res, next) {
  var userCount = yield db.getUserCount();
  res.end('We have ' + userCount + ' registered users.');
});
```

Uncaught exceptions will not keep the request lingering. ```co-express-router``` will call ```next(err)``` (where ```err``` is the exception) when an exception is not handled within the generator function body.
```javascript
app.get('/', function*(req, res, next) {
  var e = new Error("I am an uncaught exception");

  // will call next(e);
  throw e;
});
```

Use this ```express middleware``` for catching the errors
```javascript
module.exports = function (app) {
  app.use(function (err, req, res, next) {
    const type = err.type || 500;
    console.error('[HTTP:'+ type +']', req.method, req.url);
    console.error(req.headers['user-agent']);
    console.error(err.message || err);
    res.status(type).send(message);
  });
};
```
You should differentiate routes frontend and backend if necessary

## License
MIT
