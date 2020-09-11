#!/usr/bin/env node

/*jslint node: true */
"use strict";

const jwt = require('jsonwebtoken')
const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
  SConst
} = require('../../constants/storeConstants');

const SECRET = "SECRETO_PARA_ENCRIPTACION"
const validate = (req, res, next) => {
    // console.dir(req.originalUrl) // '/admin/new?a=b' (WARNING: beware query string)
//   console.dir(req.baseUrl) // '/admin'
  console.dir(req.path) // '/new'
//   console.dir(req.baseUrl + req.path)

  if (req.path == "/session" || req.path == "/token") {
      next();
      return;
  }

  const token = req.body.token || req.query.token || req.headers['x-access-token']
  if (!token) {
    return res.status(403).send({
        "error": true,
        "message": 'No token provided.'
    });
  }
  // decode token

    // verifies secret and checks exp
    jwt.verify(token, SECRET, function(err, decoded) {
        if (err) {
            return res.status(401).json({"error": true, "message": 'Unauthorized access.' + err });
        }
        req.decoded = decoded;
        req.id = uniqueRequestId(decoded.username);
        next();
    });

};

const uniqueRequestId = (userName) => { 
    if (!userName) {
        return `noname_${new Date().getTime()}`;    
    }
    return `${userName}_${new Date().getTime()}`;
};

module.exports = {
  validate
};
