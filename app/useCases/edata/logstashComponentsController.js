#!/usr/bin/env node

/*jslint node: true */
"use strict";

// const service = require('../../services/db/edata2StoreService');
const errorRes = require('../../../lib/error/storeError');
const {
  SConst
} = require('../../constants/storeConstants');

const logger = require('../../../lib/logger/bunyanLogger').logger('');


const addStocks = async (req, res) => {
logger.info({
    id: req.id
}, "Add stocks.");
  // const userId = req.decoded.id;
  // const stockId = req.body.stockId;
  // const quantity = req.body.quantity;
  //
  // const result = await service.addProductToCart({
  //   idUser: userId,
  //   cartId: cartId,
  //   stockId: stockId,
  //   quantity: quantity
  // });
  return res.send({todo: 'todo'}); //TODO parse them before sending
};

module.exports = {
  addStocks

};
