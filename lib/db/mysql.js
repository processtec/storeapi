#!/usr/bin/env node

/*jslint node: true */
"use strict";

const mysql = require('mysql');
const config = require('config');

const todo  = config.get('SERVER.API_BASE');
const logger = require('../logger/bunyanLogger').logger('mysql');

const pool  = mysql.createPool({ // TODO read from config
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : 'Billi07@(',
  database        : 'store',
  // debug           : true,
  trace           : true
});

pool.query('SELECT * from user', function (error, results, fields) {
  logger.debug("Here in mysql connection...");
  if (error) throw error;
  console.log('users are: ', results.length);
});
/*
pool.on('acquire', function (connection) {
  logger.debug('Connection %d acquired', connection.threadId);
});

pool.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment=1')
});

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});*/

const destroyPool = () => {
  pool.end(function (err) {
    // all connections in the pool have ended
  });
};

//pool.query = util.promisify(pool.query) // Do this--> https://medium.com/@mhagemann/create-a-mysql-database-middleware-with-node-js-8-and-async-await-6984a09d49f4

module.exports = {
  destroyPool,
  db: pool
};


// TIPS
// this might help:
// https://github.com/mysqljs/mysql#multiple-statement-queries
