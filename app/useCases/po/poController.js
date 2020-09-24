#!/usr/bin/env node

/*jslint node: true */
"use strict";

const { poById, poByQuery } = require('../../services/search/poSearchService');
const errorRes = require('../../../lib/error/storeError');
const {
    SConst
} = require('../../constants/storeConstants');

const logger = require('../../../lib/logger/bunyanLogger').logger('');

const getPO = async (req, res) => {
    logger.info({
        id: req.id,
        id: req.params.id
    }, "GET PO by id.");
    const poID = Number(req.params.id);
    if (!Number.isInteger(poID)) {
        return res.send(errorRes("po id should be an integar!", "path", "stack", "code"));
    }

    const po = await poById({
        reqId: req.id,
        poID: poID
    });

    const result =  sanitizePO(po);
    return res.send(result);//TODO parse them before sending
};

const searchPO = async (req, res) => {
    logger.info({
        id: req.id,
        query: req.query
    }, "Search PO.");
    const query = req.query.q
    if (query.length < 3) {
        return res.send(errorRes("query should have at least 3 chars!", "path", "stack", "code"));
    }

    const pos = await poByQuery(
        {
            reqId: req.id,
            query: query
        });
    
    const result =  sanitizePO(pos);
    return res.send(result); //TODO parse them before sending
};

const sanitizePO = (pos) => {
    let result = [];
    for (let index = 0; index < pos.length; index++) {
        let po = pos[index]._source;
        result.push(po);
    }
    return result;
};

module.exports = {
    getPO,
    searchPO
};
