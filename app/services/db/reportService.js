#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const { db } = require("../../../lib/db/mysql2");
const { SConst } = require("../../constants/storeConstants");

const getCarts = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching all carts reports for all users:",
    options.userName
  );
  let result;
  // "SELECT * FROM store.report_cart_tx where idUser = ? AND status <> ?"
  // Use above when ned to show own carts only
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.report_cart_tx where status <> ?",
      [SConst.REPORT_CART.STATUS.DELETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched all carts for all users."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getCartShipmentsById = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching cart's shipments for user:",
    options.userName
  );
  let result;
  // "SELECT * FROM store.report_shipment where idUser = ? AND idcart_tx = ? AND status <>"
  // use iduser for using specific user only.
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.report_shipment where idcart_tx = ? AND status <> ?",
      [options.cartId, SConst.REPORT_CART.STATUS.DELETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched a cart's shipments by id."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getCartShipmentDetails = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching cart's shipment details for user:",
    options.userName
  );
  let result;
  // "SELECT * FROM store.report_shipment where idUser = ? AND idcart_tx = ? AND status <>"
  // use iduser for using specific user only.
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.report_shipment_details where idreport_shipment = ? AND status <> ?",
      [options.shipmentId, SConst.REPORT_CART.STATUS.DELETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched a cart's shipments by id."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

/*const getCartShipmentsByCartId = async (options) => {
  let cartTxId = await getCartShipmentTxIdFromCartId(options);
  options.cartId = cartTxId;

  let result = await getCartShipmentsById(options);
  return result;
};*/

const getCartShipmentTxIdFromCartId = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching cart's report tx id:",
    options.userName
  );
  let result;
  
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.report_cart_tx where idcart = ? AND status <> ?",
      [options.cartId, SConst.REPORT_CART.STATUS.DELETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched a cart's report tx id from cartId."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};



module.exports = {
  getCarts,
  getCartShipmentsById,
  getCartShipmentDetails,
  getCartShipmentTxIdFromCartId
};
