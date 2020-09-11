#!/usr/bin/env node

/*jslint node: true */
"use strict";
const logger = require('../../../../lib/logger/bunyanLogger').logger('');
const service = require('../../../services/db/warehouseService');

const getWarehouses = async (req, res) => {
  // TODO
  logger.debug("will give you all warehouses...");
  const warehouses = await service.findAll();

  res.send(warehouses);
};

module.exports = {
    getWarehouses
};
