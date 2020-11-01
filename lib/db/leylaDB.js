#!/usr/bin/env node

/*jslint node: true */
"use strict";

const sql = require('mssql');
// const config = require('config');
//
// const todo = config.get('SERVER.API_BASE');
// const logger = require('../logger/bunyanLogger').logger('leyla');


// const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const config = {
    user: 'TODO',
    password: 'TODO',
    server: 'TODO',
    database: 'EData3_ProcessTec',
    // database: 'EData3_Test',
    pool: {
        max: 2,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const destroyPool = () => {
    pool.close();
};

const initialize = async () => {
  await pool1Connect; // ensures that the pool has been created
};


// async/await style:
const pool = new sql.ConnectionPool(config);
const pool1Connect = pool.connect();

pool.on('error', err => {
    console.error('Error received: ', err);
})

module.exports = {
    destroyPool,
    initialize: initialize,
    db: pool,
    sql: sql
};







// (function() {

//   // messageHandler();
//   initialCall();
// })();

// another way of writing above
// (() => {
//
//   // messageHandler();
//   initialCall();
// })();
