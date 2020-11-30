#!/usr/bin/env node

/*jslint node: true */
"use strict";

const config = require('config');
const IMG_PORT = config.get('SERVER.PORT');
const IMG_IP = config.get('SERVER.IP');

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

const getImages = (component) => {
    let result;
    
    if(component.url.length > 1) {
        result = [getBasePath(component.path) + "/" + component.url];
    } else {
        const baseURL = "http://"+IMG_IP + ":"+ IMG_PORT + "/static/images";
        result = [baseURL+"/app/under_construction.png"];
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
    // these documents lives in --> C:\inetpub\wwwroot\Leyla\Uploads\Documentation\2 in production
    // on production windows machine, run powershell and enter PS C:\inetpub\wwwroot\Leyla> Compress-Archive -LiteralPath .\Uploads\Documentation\ -DestinationPath C:\inetpub\wwwroot\
    // Leyla\Uploads\documentation.zip
    // then copy it to mac share folder
    // Documentation\\D\\A1

    return result;
};

module.exports = {
    addImages,
    getImages
};
