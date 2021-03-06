#!/usr/bin/env node

/*jslint node: true */
"use strict";

const { isRoleValid } = require("../../../lib/util/roleValidator");
const sender = require("../../../lib/util/responseSender");
const service = require("../../services/db/reportService");
const leylaImage = require("../../../lib/util/leylaImage");
const errorRes = require("../../../lib/error/storeError");
const { SConst } = require("../../constants/storeConstants");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const expectedRole = SConst.USER.ROLES.ENGINEER;
const forbiddenResult = {
  errorCode: 403,
  error: {
    message: "Forbidden",
  },
};

// returns all carts which has done a shipment
const getAllCartsReport = async (req, res) => {
  logger.info(
    {
      id: req.id,
    },
    "getting all carts reports for a user."
  );
  const decodedRole = req.decoded.role;
  if (!isRoleValid(expectedRole, decodedRole)) {
    logger.error({ id: req.id, error: "forbidden" }, "user not allowed.");
    return sender.send(res, forbiddenResult);
  }
  const userName = req.decoded.username;
  const userId = req.decoded.id;
  const carts = await service.getCarts({
    userName: userName,
    userId: userId,
    reqId: req.id,
  });
  return res.send(carts);
};

// returns all shipments done for a cart
const getCartShipmentsReport = async (req, res) => {
  logger.info(
    {
      id: req.id,
      cartId: req.params.id,
    },
    "Get cart shipments called."
  );
  const decodedRole = req.decoded.role;
  if (!isRoleValid(expectedRole, decodedRole)) {
    logger.error(
      {
        error: "forbidden",
      },
      "user not allowed."
    );
    return sender.send(res, forbiddenResult);
  }

  const cartId = Number(req.params.id);
  if (!Number.isInteger(cartId)) {
    return res.send(
      errorRes("cart id should be an integar!", "path", "stack", "code")
    );
  }

  const userName = req.decoded.username;
  const userId = req.decoded.id;
  const shipments = await service.getCartShipmentsById({
    userId: userId,
    userName: userName,
    cartId: cartId,
    reqId: req.id,
  });
  return res.send(shipments);
};

// retuns a shipment details for a cart
const getCartShipmentReportDetails = async (req, res) => {
  logger.info(
    {
      id: req.id,
      cartId: req.params.id,
    },
    "Get carts shipment details called."
  );
  const decodedRole = req.decoded.role;
  if (!isRoleValid(expectedRole, decodedRole)) {
    logger.error(
      {
        error: "forbidden",
      },
      "user not allowed."
    );
    return sender.send(res, forbiddenResult);
  }

  const shipmentId = Number(req.params.id);
  if (!Number.isInteger(shipmentId)) {
    return res.send(
      errorRes("shipment id should be an integar!", "path", "stack", "code")
    );
  }

  const userName = req.decoded.username;
  const userId = req.decoded.id;
  let shipment = await service.getCartShipmentDetails({
    userId: userId,
    userName: userName,
    shipmentId: shipmentId,
    reqId: req.id,
  });

  logger.debug("shipment received in controller.");
  for (let index = 0; index < shipment.length; index++) {
    const shipRecord = shipment[index];
    const componentImage = leylaImage.getImages({
      path: shipRecord.cmpImagePath || "",
      url: shipRecord.cmpImageUrl || "",
    });
    shipRecord.componentImage = componentImage;
  }

  logger.debug(
    {
      shipment: shipment,
    },
    "Controller sending shipment"
  );
  return res.send(shipment);
};

const modifyCartShipmentReportDetails = async (req, res) => {
  logger.info(
    {
      id: req.id,
      cartId: req.params.id,
    },
    "Get carts shipment details called."
  );
  const decodedRole = req.decoded.role;
  if (!isRoleValid(expectedRole, decodedRole)) {
    logger.error(
      {
        error: "forbidden",
      },
      "user not allowed."
    );
    return sender.send(res, forbiddenResult);
  }

  const shipmentReportId = Number(req.params.id);
  if (!Number.isInteger(shipmentReportId)) {
    return res.send(
      errorRes("shipment id should be an Integer!", "path", "stack", "code")
    );
  }

  const userName = req.decoded.username;
  const userId = req.decoded.id;
  let updateResult = await service.updateCartShipmentTxIdFromCartId({
    userId: userId,
    userName: userName,
    shipmentReportId: shipmentReportId,
    shipment: req.body.shipment,
    reqId: req.id,
  });

  return res.send(updateResult);
};

module.exports = {
  getAllCartsReport,
  getCartShipmentsReport,
  getCartShipmentReportDetails,
  modifyCartShipmentReportDetails,
};
