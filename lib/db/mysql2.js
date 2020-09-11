#!/usr/bin/env node

/*jslint node: true */
"use strict";

const mysql = require('mysql2');
const config = require('config');
const {
    TIMESTAMP
} = require('mysql2/lib/constants/types');

const todo = config.get('SERVER.API_BASE');
const logger = require('../logger/bunyanLogger').logger('mysql');

const pool = mysql.createPool({ // TODO read from config
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'Billi07@(',
    database: 'store',
    // timezone        : 'utc',
    waitForConnections: true,
    // debug           : true,
    trace: true
});

const destroyPool = () => {
    pool.end(function (err) {
        // all connections in the pool have ended
    });
};


module.exports = {
    destroyPool,
    db: pool.promise()
};


// TIPS
// Best one: use prepared statements via query --> https://medium.com/tech-tajawal/mysql2-with-nodejs-prepared-statement-cache-issue-cant-create-more-than-8b3818341df6
// Good design and tips: https://evertpot.com/executing-a-mysql-query-in-nodejs/