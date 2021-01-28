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
      "SELECT * FROM store.report_cart_tx where status <> ? ORDER BY createdOn DESC",
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

  let shipment = await findCartShipmentDetails(options);
  for (let index = 0; index < shipment.length; index++) {
    const ship = shipment[index];
    const existingComponentAddition = await findComponentAdditionsByComponent(
      ship
    );
    if (
      Array.isArray(existingComponentAddition) &&
      existingComponentAddition.length > 0
    ) {
      ship.reportDescription = existingComponentAddition[0].reportDescription;
    }
  }

  return shipment;
};

const findCartShipmentDetails = async (options) => {
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

const updateCartShipmentTxIdFromCartId = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "updateCartShipmentTxIdFromCartId:",
    options.userName
  );
  const connection = await db.getConnection();
  await connection.beginTransaction();
  let result = true;
  const shipment = options.shipment || [];
  try {
    for (let index = 0; index < shipment.length; index++) {
      const ship = shipment[index];
      await updateLineItemCartShipmentTxIdFromCartId(
        connection,
        ship,
        options.reqId
      );
      const existingComponentAddition = await findComponentAdditionsByComponent(
        ship,
        options.reqId
      );
      if (
        !Array.isArray(existingComponentAddition) ||
        existingComponentAddition.length < 1
      ) {
        // create cart report
        await insertComponentAdditions(connection, ship, options.reqId);
      } else {
        // update
        await updateComponentAdditions(connection, ship, options.reqId);
      }
    }
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    // TODO return custom errors.
    logger.error(e);
    result = {
      error: e,
    };
  } finally {
    connection.release();
    return result;
  }
};

// PRIVATE
const updateLineItemCartShipmentTxIdFromCartId = async (
  connection,
  options,
  reqId
) => {
  logger.debug(
    {
      id: reqId,
    },
    "updating cart's report tx id:"
  );
  let result;

  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.report_shipment_details SET lineitem = ? where idcartTx = ? AND idreport_shipment = ? AND status <> ?",
      [
        options.lineItem,
        options.idcartTx,
        options.idreport_shipment,
        SConst.REPORT_CART.STATUS.DELETED,
      ]
    );
    result = rows;
    logger.info(
      {
        id: reqId,
        result: result,
      },
      "updating  cart's report tx id for lineitem."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const findComponentAdditionsByComponent = async (options, reqId) => {
  logger.debug(
    {
      id: reqId,
    },
    "finding from ComponentAdditions:"
  );
  let result;

  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.componentAdditions WHERE idcmp = ?",
      [options.idcmp]
    );
    result = rows;
    logger.info(
      {
        id: reqId,
        result: result,
      },
      "found from ComponentAdditions."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const insertComponentAdditions = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Inserting into ComponentAdditions:",
    options.userName
  );
  let result;

  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "INSERT INTO store.componentAdditions SET idcmp = ?, reportDescription = ?",
      [options.idcmp, options.reportDescription]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "Inserted into ComponentAdditions."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const updateComponentAdditions = async (connection, options, reqId) => {
  logger.debug(
    {
      id: reqId,
    },
    "updating ComponentAdditions:"
  );
  let result;

  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.componentAdditions SET reportDescription = ? where idcmp = ?",
      [options.reportDescription, options.idcmp]
    );
    result = rows;
    logger.info(
      {
        id: reqId,
        result: result,
      },
      "updated ComponentAdditions."
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
  getCartShipmentTxIdFromCartId,
  updateCartShipmentTxIdFromCartId,
};
