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
    // const imagedComponent = addImages([component]);
    // return res.send(imagedComponent);//TODO parse them before sending
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
        if(component.url.length > 1) {
            const completeURL = getBasePath(component.path) + "/" + component.url
            component.images = [getBasePath(component.path) + "/" + component.url];    
        } else {
            component.images = ["https://www.hpeprocess.com/wp-content/uploads/2011/08/Visco-Twin-Pumps-300x240.png",
        "https://docplayer.net/docs-images/53/31653923/images/1-0.png"];
        }
        
        result.push(component);
    }
    return result;
};

const getBasePath = (path) => {
    // var str = "C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1";
    const subPath = path.substr(35);

//   var str = "C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1";
  const pathTokens = subPath.split("\\"); //0: Documentation, 1: D, 2: A1
  let result = "http://127.0.0.1:8080/static/images";
  for (let index = 0; index < pathTokens.length; index++) {
      const element = pathTokens[index];
      result += "/" + element;
  }

    // C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1
    // Documentation\\D\\A1

    return result;
};

module.exports = {
    getComponent,
    getComponents
};