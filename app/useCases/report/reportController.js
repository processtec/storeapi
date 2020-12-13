#!/usr/bin/env node

/*jslint node: true */
"use strict";

const {
    isRoleValid
} = require('../../../lib/util/roleValidator');
const sender = require('../../../lib/util/responseSender');
const service = require('../../services/db/reportService');
const errorRes = require('../../../lib/error/storeError');
const expectedRole = SConst.USER.ROLES.ENGINEER;
const {
    SConst
} = require('../../constants/storeConstants');
const logger = require('../../../lib/logger/bunyanLogger').logger('');

// returns all carts which has done a shipment
const getAllCartsReport = async (req, res) => {
    logger.info({
        id: req.id
    }, "getting all carts reports for a user.");
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({id: req.id,
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }
    const userName = req.decoded.username;
    const userId = req.decoded.id;
    const carts = await service.getCarts({
        userName: userName,
        userId: userId,
        reqId: req.id
    });
    return res.send(carts);
};

// returns all shipments done for a cart
const getCartShipmentsReport = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Get cart shipments called.");
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }

    const cartId = Number(req.params.id);
    if (!Number.isInteger(cartId)) {
        return res.send(errorRes("cart id should be an integar!", "path", "stack", "code"));
    }

    const userName = req.decoded.username;
    const userId = req.decoded.id;
    const cart = await service.getCartShipmentsById({
        userId: userId,
        userName: userName,
        cartId: cartId,
        reqId: req.id
    });
    return res.send(cart);
};

// retuns a shipment details for a cart
const getCartShipmentReportDetails = async () => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Get carts shipment details called.");
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }

    const shipmentId = Number(req.params.id);
    if (!Number.isInteger(shipmentId)) {
        return res.send(errorRes("shipment id should be an integar!", "path", "stack", "code"));
    }

    const userName = req.decoded.username;
    const userId = req.decoded.id;
    const cart = await service.getCartShipmentDetails({
        userId: userId,
        userName: userName,
        shipmentId: shipmentId,
        reqId: req.id
    });
    return res.send(cart);
};

module.exports = {
    getAllCartsReport,
    getCartShipmentsReport,
    getCartShipmentReportDetails
};