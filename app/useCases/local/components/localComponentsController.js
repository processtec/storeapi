#!/usr/bin/env node

/*jslint node: true */
"use strict";

const service = require('../../../services/search/componentsSearchService');
const errorRes = require('../../../../lib/error/storeError');
const {
    SConst
} = require('../../../constants/storeConstants');

const logger = require('../../../../lib/logger/bunyanLogger').logger('');

const getComponents = async (req, res) => {
    logger.info({
        id: req.id
    }, "Get all components.");

    const components = await service.componentsAll({
        reqId: req.id
    });
    return res.send(components); //TODO parse them before sending
};

module.exports = {
    getComponents
};
