#!/usr/bin/env node

/*jslint node: true */
"use strict";
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const { db } = require('../../../lib/db/mysql2');

const create = async (name, code) => {
  if (!name && !code) {
    logger.error('name or code missing!');
    return "error";
  }
  logger.debug("adding a new site...");

  let result;
  try {
    const [rows, fields] = await db.execute('INSERT INTO site SET name = ?, code = ?', [ name, code ]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "new site created.");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const update = async (id, name, code) => {
  if (!id && !name && !code) {
    logger.error('name or code missing!');
    return "error";
  }
  logger.debug("updating a site...");

  let result;
  try {
    const [rows, fields] = await db.query('UPDATE site SET name = ?, code = ? WHERE idsite = ?', [name, code, id]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Site updated.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const findAll = async () => {
  logger.debug("will be returning all sites now...");
  let result;
  try {
    const [rows, fields] = await db.query('SELECT * from site');
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Found all sites.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const findOne = async (id) => {
  logger.debug("will be returning all sites now...");

  let result;
  try {
    const [rows, fields] = await db.execute('SELECT * from site where idsite = ?', [ id ]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "found a site.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const deactivate = async (id) => {
  logger.debug("will be returning all sites now...");

  let result;
  try {
    const [rows, fields] = await db.execute('UPDATE site SET isActive = 0 where idsite = ?', [ id ]);
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Site deactivated.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

module.exports = {
    create,
    findAll,
    findOne,
    deactivate,
    update
};
