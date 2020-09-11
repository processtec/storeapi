#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    db
} = require('../../../lib/db/mysql2');
const {
    SConst
} = require('../../constants/storeConstants');




const create = (options) => {
    logger.debug("will create an of type", options.type);

    const myTimer = setTimeout(createAnAlert, SConst.ALERT.TIMEOUT, options);
};

const createAnAlert = (options) => {
    logger.debug("creating an alert of type", options.type);

    db.query('INSERT INTO store.alert SET type = ?, idUser = ?, userName = ?, message = ?, isAlerted = 0, description = ?', [options.type, options.idUser, options.userName, options.message, options.description], function (err, results) {
        if (err) {
        logger.error({
            id: req.id,
            error: err
        }, 'Error while adding to Alerts!', err);
    } else {
        logger.info({
            id: options.reqId,
            result: results
        }, "created an alert.");
    }
    });
};


const getAllActive = async () => {

};

const getAllActiveWithStatus = async () => {

};


module.exports = {
    create,
    getAllActive,
    getAllActiveWithStatus
}