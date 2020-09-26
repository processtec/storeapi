#!/usr/bin/env node

/*jslint node: true */
"use strict";

const {
    isRoleValid
} = require('../../../lib/util/roleValidator');
const sender = require('../../../lib/util/responseSender');
const service = require('../../services/db/cartService');
const errorRes = require('../../../lib/error/storeError');
const {
    SConst
} = require('../../constants/storeConstants');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const expectedRole = SConst.USER.ROLES.ENGINEER;
const forbiddenResult = {
    errorCode: 403,
    error: {
        message: 'Forbidden'
    }
};

const getCart = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Get cart called.");
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
    const cart = await service.getById({
        userId: userId,
        userName: userName,
        cartId: cartId,
        reqId: req.id
    });
    return res.send(cart); //TODO parse them before sending
};

const getCarts = async (req, res) => {
    logger.info({
        id: req.id
    }, "getting all carts for a user.");
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({id: req.id,
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }
    const userName = req.decoded.username;
    const userId = req.decoded.id;
    const carts = await service.getAll({
        userName: userName,
        userId: userId,
        reqId: req.id
    });
    return res.send(carts); //TODO parse them before sending
};

const createCart = async (req, res) => {
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }

    const userId = req.decoded.id;
    const userName = req.decoded.username;
    const fName = req.decoded.fName;
    const lName = req.decoded.lName;
    const poId = req.body.ocId;
    const ocId = req.body.ocId;
    const jobname = req.body.jobname || "";
    const costcenterid = req.body.costcenterid || "";
    const title = req.body.title || "";
    const description = req.body.description;

    const carts = await service.create({
        idUser: userId,
        fname: fName,
        lname: lName,
        idpo: poId,
        idoc: ocId,
        jobname: jobname,
        costcenterid: costcenterid,
        title: title,
        reqId: req.id,
        description: description
    });
    return res.send(carts); //TODO parse them before sending
};

const modifyCart = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Modify cart called.");
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
    const userId = req.decoded.id;
    const userName = req.decoded.username;
    const fName = req.decoded.fName;
    const lName = req.decoded.lName;
    const status = req.body.status;
    const result = await service.modifyStatus({
        idUser: userId,
        fname: fName,
        lname: lName,
        idcart: cartId,
        status: status,
        reqId: req.id
    });
    return res.send(result); //TODO parse them before sending
};

const deleteCarts = async (req, res) => {
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }

    const userId = req.decoded.id;

    const result = await service.deleteAll({
        userId: userId,
        reqId: req.id
    });

    return res.send(result);
};

const deleteCart = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Delete cart called.");
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

    const userId = req.decoded.id;
    const userName = req.decoded.username;

    const result = await service.deleteOne({
        userId: userId,
        userName: userName,
        cartId: cartId,
        reqId: req.id
    });

    return res.send(result);
};

const addProduct = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Add product to cart called.");
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
    const userId = req.decoded.id;
    const stockId = req.body.stockId;
    const quantity = req.body.quantity;

    const result = await service.addProductToCart({
        idUser: userId,
        cartId: cartId,
        stockId: stockId,
        quantity: quantity,
        reqId: req.id
    });
    return res.send(result); //TODO parse them before sending
};

const modifyProduct = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Modify product in cart called.");
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
    const userId = req.decoded.id;
    const stockId = req.body.stockId;
    const quantity = req.body.quantity;

    const result = await service.modifyProductForCart({
        idUser: userId,
        cartId: cartId,
        stockId: stockId,
        quantity: quantity,
        reqId: req.id
    });
    return res.send(result); //TODO parse them before sending
};

const checkout = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Checkout cart called.");
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
    const ocId = req.body.ocId;
    const userId = req.decoded.id;
    const userName = req.decoded.username;
    const fName = req.decoded.fName;
    const lName = req.decoded.lName;

    const result = await service.checkoutACart({
        userId: userId,
        userName: userName,
        fName: fName,
        lName: lName,
        cartId: cartId,
        ocId: ocId,
        reqId: req.id
    });
    // return res.send(result); //TODO parse them before sending
    return sender.send(res, result);
};

const deleteProduct = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.params.id
    }, "Delete a product from cartcalled.");
    const decodedRole = req.decoded.role;
    if (!isRoleValid(expectedRole, decodedRole)) {
        logger.error({
            error: 'forbidden'
        }, "user not allowed.");
        return sender.send(res, forbiddenResult);
    }

    const cartId = req.params.id;
    const userId = req.decoded.id;
    const stockId = req.body.stockId;

    const result = await service.deleteAProduct({
        userId: userId,
        cartId: cartId,
        stockId: stockId,
        reqId: req.id
    });
    return res.send(result); //TODO parse them before sending
};

module.exports = {
    getCarts,
    getCart,

    createCart,
    addProduct,

    modifyCart,
    modifyProduct,
    checkout,

    deleteCarts,
    deleteCart,
    deleteProduct
};