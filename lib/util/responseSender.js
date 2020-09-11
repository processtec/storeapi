#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../logger/bunyanLogger').logger('');
const {
    SConst
} = require('../../app/constants/storeConstants');
const send = (res, result) => {
    if (!result) {
        logger.error({
            response: 'No result'
        }, 'returning 400');
        
        return res.status(400).send({
            error: 'Unable to process results! Please share the flow @:' + SConst.ADMIN.EMAIL
        });
    }

    if (_.has(result, 'error')) {
        logger.error({
            response: result.error
        }, 'returning ERROR.');

        let statusCode = 400;
        
        if(_.has(result, 'errorCode')) {
            statusCode = result.errorCode;
        }
        
        return res.status(statusCode).send({
            error: result.error.message
        });
    }

    return res.send(result);
};


module.exports = {
    send
}