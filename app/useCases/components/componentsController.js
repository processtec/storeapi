#!/usr/bin/env node

/*jslint node: true */
"use strict";

const { componentById, componentsSearched } = require('../../services/search/componentsSearchService');
const errorRes = require('../../../lib/error/storeError');
const {
    SConst
} = require('../../constants/storeConstants');
const { result } = require('lodash');

const logger = require('../../../lib/logger/bunyanLogger').logger('');

const getComponent = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Get component called.");
    const cmpId = Number(req.params.id);
    if (!Number.isInteger(cmpId)) {
        return res.send(errorRes("component id should be an integar!", "path", "stack", "code"));
    }

    const component = await componentById({
        reqId: req.id,
        cmpId: cmpId
    });
    return res.send(component);//TODO parse them before sending
};

const getComponents = async (req, res) => {
    logger.info({
        id: req.id,
        query: req.query
    }, "GET components by query.");   
    const query = req.query.q
    if (query.length < 3) {
        return res.send(errorRes("query should have at least 3 chars!", "path", "stack", "code"));
    }

    const components = await componentsSearched({
        reqId: req.id,
        q: query
    });

    const imagedComponents = addImages(components);
    return res.send(imagedComponents); //TODO parse them before sending
};

const addImages = (components) => {
    let result = [];
    for (let index = 0; index < components.length; index++) {
        let component = components[index]._source;
        component.images = ["https://www.hpeprocess.com/wp-content/uploads/2011/08/Visco-Twin-Pumps-300x240.png",
        "https://docplayer.net/docs-images/53/31653923/images/1-0.png"];
        result.push(component);
    }
    return result;
};

module.exports = {
    getComponent,
    getComponents
};