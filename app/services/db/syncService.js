#!/usr/bin/env node

/*jslint node: true */
"use strict";

const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    db
} = require('../../../lib/db/mysql2');

const lastProductSyncTimeStamp = async () => {
    logger.debug('fetching lastProductSyncTimeStamp');
    let result;
    try {
        const [rows, fields] = await db.execute('SELECT * FROM store.inventorySync ORDER BY idinventorySync DESC LIMIT 0, 1');
        if (rows.length > 0) {
            result = rows[0];
        } else {
            result = null;
        }
        
        logger.info({
            result: result
        }, "products synced last time at");
    } catch (e) {
        // TODO return custom errors.
        logger.error(e);
        result = null;
    } finally {
        return result;
    }
};

const createProductSyncTimeStamp = async (options) => {

    logger.debug({
        id: options.reqId
    },"creating a new cart for oc:", options.ocId);

    let result;
    try {
        const [rows, fields] = await db.query('INSERT INTO store.inventorySync () values ()');
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "new cart created.");
    } catch (e) {
        // TODO return custom errors.
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

module.exports = {
    lastProductSyncTimeStamp,
    createProductSyncTimeStamp
}