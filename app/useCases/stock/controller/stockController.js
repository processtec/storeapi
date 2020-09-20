#!/usr/bin/env node

/*jslint node: true */
"use strict";

const errorRes = require('../../../../lib/error/storeError');
const {
    addProductTx,
    sellProductTx,
    findOne,
    findOneByComponentId,
    getAvailableProductsForStockId
} = require('../../../services/db/stockService');
const {
    SConst
} = require('../../../constants/storeConstants');
const sender = require('../../../../lib/util/responseSender');
const logger = require('../../../../lib/logger/bunyanLogger').logger('');


const getStock = async (req, res) => {
  logger.info({
      id: req.id,
      stockId: req.params.id
  }, "Get stocks called.");

  const stockId = Number(req.params.id);
  if (!Number.isInteger(stockId)) {
      return res.send(errorRes("stock id should be an integar!", "path", "stack", "code"));
  }

  const stock = await findOne({
      stockId: stockId,
      reqId: req.id
  });

  return sender.send(res, stock);
};

const getProductsByComponentAndStock = async (req, res) => {
  logger.info({
      id: req.id,
      stockId: req.params.stockId,
      cmpId: req.params.cmpId,
  }, "Get getProductsByComponentAndStock called.");

  const stockId = Number(req.params.stockId);
  const cmpId = Number(req.params.cmpId);
  if (!Number.isInteger(stockId) || !Number.isInteger(cmpId)) {
      return res.send(errorRes("stockId or cmpId should be an integar!", "path", "stack", "code"));
  }

  const stock = await getAvailableProductsForStockId({
      stockId: stockId,
      cmpId: cmpId,
      reqId: req.id
  });

  return sender.send(res, stock);
};


const getStockByComponent = async (req, res) => {
    logger.info({
        id: req.id,
        cmpId: req.params.id
    }, "Get stocks called.");

    const cmpId = Number(req.params.id);
    if (!Number.isInteger(cmpId)) {
        return res.send(errorRes("cmpId  should be an integar!", "path", "stack", "code"));
    }

    const stock = await findOneByComponentId({
        cmpId: cmpId,
        reqId: req.id
    });

    return sender.send(res, stock);
  };

const validateAddParams = (body) => {
    if (!body.cmpId) return {
        errMsg: 'cmpId missing.'
    };
    if (!body.idSupplier) return {
        errMsg: 'idSupplier missing.'
    };
    if (!body.idVendor) return {
        errMsg: 'idVendor missing.'
    };
    if (!body.mpin) return {
        errMsg: 'mpin missing.'
    };
    // if (!body.serialNumber)     return { errMsg: 'serialNumber missing.' }; // using idProduct generated one.
    if (!Number.isInteger(body.status)) {
        errMsg: 'wrong status.'
    };
    if (!body.costPrice) return {
        errMsg: 'costPrice missing.'
    };
    // if (!body.salePrice)        return { errMsg: 'salePrice missing.' }; not required for adding a product.
    if (!body.idPO) return {
        errMsg: 'idPO missing.'
    };
    if (!body.locationId) return {
        errMsg: 'locationId missing.'
    }; //TODO hardcode for visalia.
    /*
    if (!body.idOC)             return { errMsg: 'idOC missing.' };
    if (!body.idStock)          return { errMsg: 'idStock missing.' };

    if (!body.supplierCompany)  return { errMsg: 'supplierCompany missing.' };
    if (!body.vendorCompany)    return { errMsg: 'vendorCompany missing.' };
    */
    return {
        params: {
            cmpId: body.cmpId,
            idSupplier: body.idSupplier,
            idVendor: body.idVendor,
            mpin: body.mpin,
            costPrice: body.costPrice,
            idPO: body.idPO,
            status: body.status,
            idLocation: body.locationId
        }

    };
};

const addProduct = async (req, res) => {
    const {
        errMsg,
        params
    } = validateAddParams(req.body);

    if (errMsg) {
        // res.set('Content-Type', 'application/json'); //TODO no need as send will add that--> https://medium.com/gist-for-js/use-of-res-json-vs-res-send-vs-res-end-in-express-b50688c0cddf
        return res.send(errorRes(errMsg, "path", "stack", "code"));
    }

    let response = errorRes("unknown status", "path", "stack", "400");
    try {
        switch (params.status) {
            case SConst.PRODUCT.STATUS.ORDERED: // TODO remove from here as location cannot be provided for this.
            case SConst.PRODUCT.STATUS.AVAILABLE:
                await addProductTx(params);
                response = {
                    status: 201
                };
                break;

            default:
                logger.error("Case not handedled for status: " + params.status);
        }
    } catch (error) {
        response = errorRes(error.message, "path", "stack", "400");
    }

    // res.set('Content-Type', 'application/json');
    return res.send(response);
};

const validateSellParams = (body) => {
    cmpID, quantity, ocId, username
    if (!body.cmpId) return {
        errMsg: 'cmpId missing.'
    };
    if (!body.quantity) return {
        errMsg: 'quantity missing.'
    };
    if (!body.ocId) return {
        errMsg: 'ocId missing.'
    };


    return {
        params: {
            cmpId: body.cmpId,
            quantity: body.quantity,
            ocId: body.ocId
        }
    };
};
const sellProduct = async (req, res) => {
    const {
        errMsg,
        params
    } = validateSellParams(req.body);

    if (errMsg) {
        return res.send(errorRes(errMsg, "path", "stack", "code"));
    }

    const response = await sellProductTx(params);
// SELECT * FROM store.product where idcmp = 1234 and status = 1 ORDER BY createdOn LIMIT 3;
};


module.exports = {
    getStock,
    getProductsByComponentAndStock,
    getStockByComponent,
    addProduct,
    sellProduct
};
