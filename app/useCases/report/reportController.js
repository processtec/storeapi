#!/usr/bin/env node

/*jslint node: true */
"use strict";

const {
    isRoleValid
} = require('../../../lib/util/roleValidator');
const sender = require('../../../lib/util/responseSender');
const service = require('../../services/db/reportService');
const errorRes = require('../../../lib/error/storeError');
const {
    SConst
} = require('../../constants/storeConstants');
const logger = require('../../../lib/logger/bunyanLogger').logger('');

// returns all carts which has done a shipment
const getAllCartsReport = async () => {

};

// returns all shipments done for a cart
const getCartShipmentsReport = async () => {

};

// retuns a shipment details for a cart
const getCartShipmentReportDetails = async () => {

};

module.exports = {
    getAllCartsReport,
    getCartShipmentsReport,
    getCartShipmentReportDetails
};