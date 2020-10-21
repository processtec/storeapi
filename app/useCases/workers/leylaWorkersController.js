#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const sender = require("../../../lib/util/responseSender");
const leylaService = require("../../services/db/leylaService");
const service = require("../../services/db/syncService");
const stockService = require("../../services/db/stockService");
const errorRes = require("../../../lib/error/storeError");
const { SConst } = require("../../constants/storeConstants");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const waitTime = 1 * 5 * 1000; //5 * 60 * 1000;
const defaultLocationId = 4;
const defaultLastModifiedBy = "pmann";

const productSyncWorkerStart = async () => {
  await leylaService.initialize();

  // get timestapms from store sync table
  const lastTimeStamp = await service.lastProductSyncTimeStamp();
  if (lastTimeStamp === null) {
    //This is first time, syncing all.
    const leylaInventory = await leylaService.getAllInventory();
    // TODO for each sync to store db products and stocks table
    const storeProductsFromLeyla = createStoreProductsFromLeylaInventory(
      leylaInventory
    );
    /*for (let index = 0; index < storeProductsFromLeyla.length; index++) {
      const product = storeProductsFromLeyla[index];
      await stockService.addProductTx(product);
    }*/
    await stockService.addProductsTx(storeProductsFromLeyla);
    // then store the timespamp in inventorySync table.
    await service.createProductSyncTimeStamp();
    return;
  }

  await runProductSyncDaemon();
};

const createStoreProductsFromLeylaInventory = (leylaInventory) => {
  var storeProducts = [];
  const uniqueInventory = _.uniqBy(leylaInventory, "ComponentID"); // _.uniq(leylaInventory, x => x.ComponentID);
  for (let i = 0; i < uniqueInventory.length; i++) {
    const item = uniqueInventory[i];

    for (let index = 0; index < item.QuantityInStock; index++) {
      const product = {
        cmpId: item.ComponentID,
        idSupplier: item.SupplierID,
        idVendor: item.SupplierID, //TODO check this with Andreas
        mpin: item.SupplierPartNumber,
        status: SConst.PRODUCT.STATUS.AVAILABLE,
        costPrice: item.UnitPrice,
        idPO: item.PurchaseOrderID,

        supplier_company: item.SupplierCompany,
        PurchaseOrderCode: item.PurchaseOrderCode,

        idLocation: defaultLocationId,
        lastModifiedBy: defaultLastModifiedBy,
      };

      storeProducts.push(product);
    }

    for (let index = 0; index < item.ReorderQuantity; index++) {
      const product = {
        cmpId: item.ComponentID,
        idSupplier: item.SupplierID,
        idVendor: item.SupplierID, //TODO check this with Andreas
        mpin: item.SupplierPartNumber,
        status: SConst.PRODUCT.STATUS.ORDERED,
        costPrice: item.UnitPrice,
        idPO: item.PurchaseOrderID,

        supplier_company: item.SupplierCompany,
        PurchaseOrderCode: item.PurchaseOrderCode,
        idLocation: defaultLocationId,
        lastModifiedBy: defaultLastModifiedBy,
      };

      storeProducts.push(product);
    }
  }
  return storeProducts;
};

const runProductSyncDaemon = async () => {
  console.log("Scheduling timer now .....");
  setTimeout(function () {
    console.log("running after waiting NOW!");
    callLogic();

    //runProductSyncDaemon(); //TODO enable it.
  }, waitTime);
  console.log(`Timer scheduled. Will run after: ${waitTime}. ZZZZzzzzzz`);
};

const callLogic = async () => {
  const pteLatestChangeTimeStamp = await leylaService.getPTEInventoryTS();
  const componentsWithDSN = await getComponentsWithDSN({
    lastTimeStamp: pteLatestChangeTimeStamp,
  });

  for (let index = 0; index < componentsWithDSN.length; index++) {
    const element = componentsWithDSN[index];
    const inventoryForAComponent = await getInventoryForAComponent({
      ComponentID: element.ComponentID,
    });
    console.log(
      "inventoryForAComponent: " + element.ComponentID + ":--> ",
      inventoryForAComponent
    );
    //TODO: for each of these update product or just call add product.
    // then store the timespamp in inventorySync table.
    await service.createProductSyncTimeStamp();
  }
};

module.exports = {
  productSyncWorkerStart: productSyncWorkerStart,
};
