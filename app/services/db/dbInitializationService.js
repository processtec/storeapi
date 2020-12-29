#!/usr/bin/env node

/*jslint node: true */
"use strict";
const logger = require("../../../lib/logger/bunyanLogger").logger(
  "warehouseService"
);
const { db } = require("../../../lib/db/mysql2");

//TODO: I doubt we need this route because when we add a product we take care of adding stock
const addComponents = async (options) => {
  logger.debug("adding a new components...");

  let result;
  const connection = await db.getConnection();
  try {
    // const sql = 'INSERT INTO store.stock (idcmp, mfgmodelnumber) VALUES ?';
    const sql = connection.format(
      "INSERT INTO store.stock (idcmp, mfgmodelnumber) VALUES ?",
      options.sanitizedComponents
    );
    // const [rows, fields] = await connection.query(sql, options.sanitizedComponents);
    const [rows, fields] = await connection.query(sql);
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "components added."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
    connection.release();
  }
};

module.exports = {
  addComponents,
};
