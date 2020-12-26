#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const { componentById, componentsSearched } = require('../../services/search/componentsSearchService');
const errorRes = require('../../../lib/error/storeError');
const leylaImage = require('../../../lib/util/leylaImage');

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

    const imagedComponent = leylaImage.addImages(component);
    if (Array.isArray(imagedComponent) && imagedComponent.length > 0) {
        return res.send([imagedComponent[0]]);
    } else {
        return res.send([]);
    }
    
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

    const uniqueComponents = _.uniqBy(components, "_source.componentid");
    const imagedComponents = leylaImage.addImages(uniqueComponents);
    return res.send(imagedComponents); //TODO parse them before sending
};

/*
const addImages = (components) => {
    let result = [];
    for (let index = 0; index < components.length; index++) {
        let component = components[index]._source;
        if(component.url.length > 1) {
            component.images = [getBasePath(component.path) + "/" + component.url];
        } else {
            const baseURL = "http://"+IMG_IP + ":"+ IMG_PORT + "/static/images";
            component.images = [baseURL+"/app/under_construction.png"];
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
    const baseURL = "http://"+IMG_IP + ":"+ IMG_PORT + "/static/images";

    if(!path.includes("\\Uploads\\")) {
        return baseURL+ "/app/under_construction.png";
    }

    const baseToken = path.split("\\Uploads\\");

    if(baseToken.length < 2) {
        return baseURL+ "/app/under_construction.png";
    }



//   var str = "C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1";
//   const pathTokens = subPath.split("\\"); //0: Documentation, 1: D, 2: A1
    const pathTokens = baseToken[1].split("\\");
  let result = baseURL;
  for (let index = 0; index < pathTokens.length; index++) {
      const element = pathTokens[index];
      result += "/" + element;
  }

    // C:\\inetpub\\wwwroot\\EData4u\\Uploads\\Documentation\\D\\A1
    // Documentation\\D\\A1

    return result;
};*/

module.exports = {
    getComponent,
    getComponents
};
