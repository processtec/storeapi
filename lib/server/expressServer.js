#!/usr/bin/env node

/*jslint node: true */
"use strict";

const express = require('express');
const bodyParser = require('body-parser');
// const expressValidator = require('express-validator'); // TODO do I need this:  https://express-validator.github.io/docs/
const passport = require('passport');
const morgan = require('morgan');
const config = require('config');
const path = require('path');

const api_base = config.get('SERVER.API_BASE');
const PORT = config.get('SERVER.PORT');

const app = express();
const router = express.Router();
const localRouter = express.Router();
const routes = require('../../app/routes/routes');
const localRoutes = require('../../app/routes/localRoutes');
const logger = require('../../lib/logger/bunyanLogger').logger('express');
const {
  validate
} = require('../../app/services/session/tokenValidator');

const imagesDir = path.normalize(path.join(__dirname, '../../public')); //path.join(__dirname, 'public');
let server;

const start = async (req, res) => {
  appMiddleWare();
  routerMiddleWare();
  localRouterMiddleWare();

  // Start the server
  server = app.listen(PORT, function() {
    logger.info("Server is live at Port: ", PORT);
  });
};

const stop = async (req, res) => {
  // TODO
  server.close();
};

const appMiddleWare = () => {
  app.use(bodyParser.json()); // support json encoded bodies
  // app.use(expressValidator()); //TODO: https://github.com/ctavan/express-validator#asynchronous-validation
  morgan.token('body', function(req, res) {
    return JSON.stringify(req.body)
  });
  app.use(morgan('Morgan::==>> METHOD-> :method URL-> :url :status :res[content-length] - :response-time ms')); // removed as it can contain passwords.--> BODY->:body
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.disable('x-powered-by');

  app.use('/static', express.static(imagesDir)); //test: http://127.0.0.1:8080/static/images/Documentation/G/RX/GRX-VFOI_ENUS.pdf

  app.use((error, req, res, next) => {
    res.header("X-powered-by", config.get('SERVER.FAKE_X_POWERED'));
    res.header("Server", config.get('SERVER.FAKE_SERVER_TAG'));
    if (error instanceof SyntaxError) {
      logger.error("Someone sent an invalid json in body: " + req.body);
      res.json({
        "error": "Not able to parse request: " + error
      });
    } else {
      next();
    }
  });

  router.use((req, res, next) => {
    validate(req, res, next);
  });

  app.use('/nnam', localRouter);
  app.use('/api', router);
};

const routerMiddleWare = () => {
  // Router middleware, mentioned it before defining routes.
  router.use((req, res, next) => {
    // CORS
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://54.176.243.227:9000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    //

    res.header("X-powered-by", config.get('SERVER.FAKE_X_POWERED'));
    res.header("Server", config.get('SERVER.FAKE_SERVER_TAG'));

    let ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    logger.trace("logging method: /" + req.method + ", remoteAddress: " + ip);

    next(); //next() function will take your router to next routes.
  });

  routes.register({
    router: router
  });
};

const localRouterMiddleWare = () => {
  // Router middleware, mentioned it before defining routes.
  localRouter.use((req, res, next) => {
    // res.header("X-powered-by", config.get('SERVER.FAKE_X_POWERED'));
    // res.header("Server", config.get('SERVER.FAKE_SERVER_TAG'));

    let ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    logger.trace("localRouter -> logging method: /" + req.method + ", remoteAddress: " + ip);

    next(); //next() function will take your router to next routes.
  });

  localRoutes.register({
    router: localRouter
  });
};


module.exports = {
  start,
  stop
};
