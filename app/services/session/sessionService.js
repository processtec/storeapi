#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    SConst
} = require('../../constants/storeConstants');
const userService = require('../db/userService');

const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');

let refreshTokens = {};
const SECRET = "SECRETO_PARA_ENCRIPTACION";

const createNewJWT = (user) => {
    return jwt.sign(user, SECRET, {
        expiresIn: SConst.SESSION.JWT.VALIDITY
    });
};

const createNewRefresh = (user) => {
    return jwt.sign(user, SECRET, {
        expiresIn: SConst.SESSION.REFRESH_TOKEN.VALIDITY
    });
};

const getValidatedUser = async(options) => {

  const result = await userService.getValidatedUserByUserName(options);
  if(!_.has(result, 'idUser')) {
    return null;
  }

  return {
    username: result.userName,
    fName: result.fname, //TODO better to have some password - hash in here so if user changes that it will be invalidated.
    lName: result.lname,
    id: result.idUser,
    role: result.idrole

  };
};

const getUser = async(options) => {

    const result = await userService.getUserByUserName(options);
  
    return {
      username: result.userName,
      fName: result.fname, //TODO better to have some password - hash in here so if user changes that it will be invalidated.
      lName: result.lname,
      id: result.idUser,
      role: result.idrole
  
    };
  };

const create = async (userOptions) => {
    const username = userOptions.username;
    const password = userOptions.password;
    // TODO validate credentials in DB and get user role.
    const user = await getValidatedUser(userOptions);
    if (user === null) {
        return null;
    }
    const token = createNewJWT(user);
    //   const refreshToken = randtoken.uid(256)
    const refreshToken = createNewRefresh(user);
    refreshTokens[refreshToken] = username;
    return {
        token: 'JWT ' + token,
        refreshToken: refreshToken
    };
    // res.json({token: 'JWT ' + token, refreshToken: refreshToken})
};

const validate = async (token) => {
    if (!token) {
        return false;
    }

    try {
    const result = await promisifiedJWTVerify(token);
    logger.info({
        id: "TODO",
        result: result
    }, "it a valid user. ");
    return true;
    } catch(error) {
        return false;
    }
};

const promisifiedJWTVerify = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, SECRET, function(err, decoded) {
            if (err) {
                reject(err);
            }
            resolve(decoded);
        });
    });
};

// new jwt will be returned
const refresh = async (userOptions) => {
    const username = userOptions.username;
    const refreshToken = userOptions.token;
    // TODO validate username and refreshToken stored in DB and get user role.
    // const user = getUser(userOptions);
    let result;
    if ((refreshToken in refreshTokens) && (refreshTokens[refreshToken] == username)) {
        const user = await getUser(userOptions); //TODO this function takes password too
        const token = createNewJWT(user);
        result = {
            token: 'JWT ' + token
        };
    } else {
        result = {
            error: "XXX"
        };
    }
    return result
};

const destroy = async (userOptions) => {
    if (userOptions.token in refreshTokens) {
        delete refreshTokens[refreshToken];
    }
    return {
        deleted: true
    };
};

module.exports = {
    create,
    validate,
    refresh,
    destroy
};
