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
    // return res.send(component);//TODO parse them before sending
    
    const imagedComponent = addImages(component);
    return res.send(imagedComponent);//TODO parse them before sending
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
            component.images = ["http://127.0.0.1:8080/static/images/app/under_construction.png"];
        }
        
        result.push(component);
    }
    return result;
};

const getBasePath = (path) => {
    // var str = "C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1";
                //   C:\\inetpub\\wwwroot\\Leyla\\Uploads\\Documentation\\S\\CH
    // const subPath = path.substr(35);
    // const baseToken = path.split("\\Uploads\\");
    // const test2 = path.split("\\Documentation\\");

    if(!path.includes("\\Uploads\\")) {
        return "http://127.0.0.1:8080/static/images/app/under_construction.png";
    }

    const baseToken = path.split("\\Uploads\\");

    if(baseToken.length < 2) {
        return "http://127.0.0.1:8080/static/images/app/under_construction.png";
    }



//   var str = "C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1";
//   const pathTokens = subPath.split("\\"); //0: Documentation, 1: D, 2: A1
    const pathTokens = baseToken[1].split("\\");
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