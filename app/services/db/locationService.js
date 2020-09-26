#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const errorRes = require("../../../lib/error/storeError");
const logger = require("../../../lib/logger/bunyanLogger").logger(
  "locationervice"
);
const { db } = require("../../../lib/db/mysql2");

const search = async (options) => {
  // TODO
  logger.debug("will be SEARCHING all locationS now...", options.query);

  let result;
  const warehouseid = Number(options.query.warehouseid);
    if (!Number.isInteger(warehouseid)) {
        throw new Error("warehouseid should be an integar!");
    }

  try {
    let dbResult;
    if (
      _.has(options.query, "level") &&
      _.has(options.query, "aisle") &&
      _.has(options.query, "rack")
    ) {
      dbResult = await db.execute(
        "SELECT * from location where idWarehouse = ? AND level = ? AND zone = ? AND rack = ? AND isActive = 1",
        [warehouseid, options.query.level, options.query.aisle, options.query.rack]
      );
    } else if (
      _.has(options.query, "level") &&
      _.has(options.query, "aisle")
    ) {
      dbResult = await db.execute(
        "SELECT * from location where idWarehouse = ? AND level = ? AND zone = ? AND isActive = 1",
        [warehouseid, options.query.level, options.query.aisle]
      );
    } else if (
      _.has(options.query, "level")
    ) {
      dbResult = await db.execute(
        "SELECT * from location where idWarehouse = ? AND level = ? AND isActive = 1",
        [warehouseid, options.query.level]
      );
    } else {
      dbResult = await db.execute(
        "SELECT * from location where idWarehouse = ? AND isActive = 1",
        [options.query.warehouseid]
      );
    }
    
    result = dbResult[0];
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched all locations for a search query."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = errorRes(e.message, "location not found in DB!", e.stack);
  } finally {
    return result;
  }
};

const getAll = async (options) => {
  // TODO
  logger.debug("will be returning all location now...");

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * from location where idWarehouse = ? AND isActive = 1",
      [options.warehouseId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched all locations for a warehouse."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = errorRes(e.message, "location not found in DB!", e.stack);
  } finally {
    return result;
  }
};

const create = async (options) => {
  logger.debug("adding a new location...");

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "INSERT INTO location SET idWarehouse = ?, name = ?, level = ?, zone = ?, rack = ?",
      [
        options.warehouseId,
        options.name,
        options.level,
        options.zone,
        options.rack,
      ]
    );
    result = rows;

    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "new location created in a warehouse."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const updateAll = async (options) => {
  logger.debug("updating a location...");

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "UPDATE location SET idWarehouse = ?, name = ?, level = ?, zone = ?, rack = ? where idlocation = ? ",
      [
        options.warehouseId,
        options.name,
        options.level,
        options.zone,
        options.rack,
        options.locationId,
      ]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "Location updated."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getById = async (options) => {
  logger.debug("will be returning a location location now...");

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * from location where idlocation = ? AND isActive = 1",
      [options.locationId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched location for an id"
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const deactivate = async (options) => {
  logger.debug("deactivating a location.");

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "UPDATE location SET isActive = 0 where idlocation = ?",
      [options.locationId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "location is no longer active."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

module.exports = {
  search,
  getAll,
  getById,
  create,
  deactivate,
  updateAll,
};
