#!/usr/bin/env node

/*jslint node: true */
"use strict";
const logger = require('../../../lib/logger/bunyanLogger').logger('warehouseService');
const {
  db
} = require('../../../lib/db/mysql2');

const findAll = async () => {
  // TODO
  logger.debug("will be returning all warehouses now...");

  let result;
  try {
    const [rows, fields] = await db.execute('SELECT * from warehouse');
    result = rows;
    logger.info({
        id: options.reqId,
        result: result
    }, "Fetched all warehouses.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }

};

const create = async (idSite, name, address1, address2, city, state, zip, country) => {
  /*if (!name && !code) { //TODO -- move these to controllers. We can do something like refundControllerV2.js OR using lodash if (!_.every(['body.XXX', 'body.YYY'], _.partial(_.has, req)))
    logger.error('name or code missing!');
    return "error";
  }*/
  logger.debug("adding a new warehouse...");

  let result;
  try {
    const [rows, fields] = await db.execute('INSERT INTO warehouse SET idsite = ?, name = ?, address1 = ?, address2 = ?, city = ?, state = ?, zip = ?, ', [idsite, name, address1, address2, city, state, zip]);
    result = rows;
    
    logger.info({
        id: options.reqId,
        result: result
    }, "DB: warehouse created.");
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const updateAddress = async (id, address1, address2, city, state, zip) => {
  logger.debug("updating a warehouse...");

  let result;
  try {
    const [rows, fields] = await db.execute('UPDATE warehouse SET address1 = ?, address2 = ?, city = ?, state = ?, zip = ? where idwarehouse = ? ', [address1, address2, city, state, zip, id]);
    result = rows;
    
    logger.info({
        id: options.reqId,
        result: result
    }, "DB: warehouse address updated.");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const updateName = async (id, name) => {
  logger.debug("updating a warehouse...");

  let result;
  try {
    const [rows, fields] = await db.execute('UPDATE warehouse SET name = ? where idwarehouse = ? ', [name, id]);
    result = rows;

    logger.info({
        id: options.reqId,
        result: result
    }, "DB: warehouse name updated");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};


const findOne = async (id) => {
  logger.debug("will be returning all warehouse now...");

  let result;
  try {
    const [rows, fields] = await db.execute('SELECT * from warehouse where idwarehouse = ?', [id]);
    result = rows;
    
    logger.info({
        id: options.reqId,
        result: result
    }, "DB: found a warehouse");
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const deactivate = async (id) => {
  logger.debug("will be returning all warehouse now...");

  let result;
  try {
    const [rows, fields] = await db.execute('UPDATE warehouse SET isActive = 0 where idwarehouse = ?', [id]);
    result = rows;
    
    logger.info({
        id: options.reqId,
        result: result
    }, "DB: A warhouse deactivated.");
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
  updateAddress,
  updateName
};