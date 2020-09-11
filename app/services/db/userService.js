#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
// const bcrypt = require('bcrypt'); //TODO move to a common util
const auth = require('../../../lib/auth/authService');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
  db
} = require('../../../lib/db/mysql2');
const {
  SConst
} = require('../../constants/storeConstants');

const saltRounds = 10;

const add = async (options) => {
  logger.debug("adding a new user for userName:", options.userName);

  let result;
  try {
      const digest = await auth.getDigest(options);
    const [rows, fields] = await db.query('INSERT INTO store.user SET fName = ?, lName = ?, digest = ?, email = ?, userName = ?', [options.fName, options.lName, digest, options.email, options.userName]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "A new user added.");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const modifyPasswordWithExisting = async (options) => {
  logger.debug("changing password for userName:", options.userName);
  const userHashResult = await getUserHash(options);
  if (!userHashResult || userHashResult.length < 1) {
      return {
          error: "User not found"
      };
  }
  options.dbDigest = userHashResult[0].digest;

  const isMatched = await auth.isPasswordMatch(options); // await bcrypt.compare(options.password, userHashResult[0].digest);

  if (!isMatched) {
    return {
        error: "check your credentials"
    };
  }

  // update password
const newHashedPassword = await auth.getDigest({password: options.newPassword}); //  await bcrypt.hash(options.newPassword, saltRounds);

  let result;
  try {
    const [rows, fields] = await db.query('UPDATE store.user SET digest = ? WHERE email = ? AND userName = ?', [ newHashedPassword, options.email, options.userName]);
    result = rows;
    logger.warn({
        id: req.id,
        result: result
    }, "password changed");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const modifyPasswordForce = async (options) => {
  logger.debug("changing password forcefully userName:", options.userName);

  // update password
const newHashedPassword = await auth.getDigest({password: options.password}); //await bcrypt.hash(options.password, saltRounds);

  let result;
  try {
    const [rows, fields] = await db.query('UPDATE store.user SET digest = ? WHERE email = ? AND userName = ?', [ newHashedPassword, options.email, options.userName]);
    result = rows;
    logger.warn({
        id: req.id,
        result: result
    }, "password modified by force.");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getUserByEmail = async (options) => {
  logger.debug("will be returning a user now...");

  let result;
  try {
    const [rows, fields] = await db.execute('SELECT * from user where email = ? AND isActive = 1', [options.email]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Fetvhed a user by email.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};


const getUserByUserName = async (options) => {
  logger.debug("will be returning a user now...");

  let result;
  try {
    const [rows, fields] = await db.execute('SELECT user.idUser, user.fname, user.lname, user.salt, user.digest, user.email, user.userName, user_role.idrole from store.user INNER JOIN store.user_role ON user_role.iduser = user.idUser where userName = ? AND isActive = 1', [options.username]);
    if (!Array.isArray(rows)) {
        throw new Error('Inavlid user!');
    }
    result = rows[0];
    logger.info({
        id: options.reqId,
        result: result
    }, "Fetched a user by userName.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getValidatedUserByUserName = async (options) => {
    logger.debug("will be returning a validated user now...");

    let result;
    try {
      const [rows, fields] = await db.execute('SELECT user.idUser, user.fname, user.lname, user.salt, user.digest, user.email, user.userName, user_role.idrole from store.user INNER JOIN store.user_role ON user_role.iduser = user.idUser where userName = ? AND isActive = 1', [options.username]);
      if (!Array.isArray(rows)) {
          throw new Error('Inavlid user!');
      }

      const isMatched = await auth.isPasswordMatch({
        password: options.password,
        dbDigest: rows[0].digest
      });

      if(isMatched) {
          result = rows[0];
      } else {
          throw new Error('Either username of password not matching!');
      }
      logger.info({
        id: options.reqId,
        result: result
    }, "DB: found a validated user by username.");
    } catch (e) {
      // TODO return error
      logger.error(e);
      result = e;
    } finally {
      return result;
    }
  };


/**
Private
*/

const getUserHash = async (options) => {
  logger.debug('fetching has for user:', options.userName);
  let result;
  try {
    const [rows, fields] = await db.execute('SELECT digest FROM store.user where email = ? AND userName = ? LIMIT 0, 1', [options.email, options.userName]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Fetched digest {its a hash ;-} for a user");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

module.exports = {
  add,
  modifyPasswordWithExisting,
  modifyPasswordForce,
  getUserByEmail,
  getUserByUserName,
  getValidatedUserByUserName
};
