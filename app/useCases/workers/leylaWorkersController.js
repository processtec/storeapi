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
const waitTime = 1 * 5 * 1000; // 5 seconds, //5 * 60 * 1000; <<-- 5 minutes
const defaultLocationId = 4;
const defaultLastModifiedBy = "pmann";
let pteInventorySyncInterval;

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

    // then store the timespamp and recordDSN in inventorySync table.
    await addToProductSync();
  }

  await runProductSyncDaemon();
};

const createStoreProductsFromLeylaInventory = (leylaInventory) => {
  var storeProducts = [];
  const uniqueInventory = _.uniqBy(leylaInventory, "ComponentID"); // _.uniq(leylaInventory, x => x.ComponentID);
  for (let i = 0; i < uniqueInventory.length; i++) {
    const item = uniqueInventory[i];

    for (let index = 0; index < item.QuantityInStock; index++) {
      /*const product = {
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
      };*/

      const product = createPTEToStoreProductMapping({
        status: SConst.PRODUCT.STATUS.AVAILABLE,
        item: item,
      });

      storeProducts.push(product);
    }

    for (let index = 0; index < item.ReorderQuantity; index++) {
      /*const product = {
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
      };*/

      const product = createPTEToStoreProductMapping({
        status: SConst.PRODUCT.STATUS.ORDERED,
        item: item,
      });
      storeProducts.push(product);
    }
  }
  return storeProducts;
};

const createPTEToStoreProductMapping = (options) => {
  const item = options.item;
  const status = options.status;
  return {
    cmpId: item.ComponentID,
    idSupplier: item.SupplierID,
    idVendor: item.SupplierID, //TODO check this with Andreas
    mpin: item.SupplierPartNumber,
    status: status,
    costPrice: item.UnitPrice,
    idPO: item.PurchaseOrderID,

    supplier_company: item.SupplierCompany,
    PurchaseOrderCode: item.PurchaseOrderCode,

    idLocation: defaultLocationId,
    lastModifiedBy: defaultLastModifiedBy,
  };
};

const runProductSyncDaemon = async () => {
  console.log("Scheduling timer now for PTE inventory sync.....");
  pteInventorySyncInterval = setInterval(function () {
    console.log("running PTE inventory sync after waiting NOW!");
    syncPTEInventory();
  }, waitTime);
  console.log(
    `Timer scheduled for PTE inventory sync. Will run after: ${waitTime}. ZZZZzzzzzz`
  );
};

const syncPTEInventory = async () => {
  const lastSync = await service.lastProductSyncTimeStamp();
  const pendingComponentsInPTEInventory = await leylaService.getComponentsWithDSN(
    {
      lastTimeStamp: lastSync.syncedTimestamp,
      recordDSN: lastSync.recordDSN,
    }
  );

  for (let index = 0; index < pendingComponentsInPTEInventory.length; index++) {
    const pendingComponent = pendingComponentsInPTEInventory[index];
    console.log(
      "Getting data for a pending component with componentId: ",
      pendingComponent.ComponentID
    );
    const pendingComponentInventoryDetailsPTE = await leylaService.getInventoryForAComponent(
      {
        ComponentID: pendingComponent.ComponentID,
      }
    );
    console.log(
      "pending inventoryForAComponentInPTE: " +
        pendingComponent.ComponentID +
        ":--> ",
      pendingComponentInventoryDetailsPTE
    );
    if (
      pendingComponentInventoryDetailsPTE === null ||
      pendingComponentInventoryDetailsPTE === undefined
    ) {
      console.error(
        "Unable to getInventoryForAComponent in PTE for componentID: ",
        pendingComponent.ComponentID
      );
      continue;
    }

    // check exiting stock quantity for this component.
    const stocks = await stockService.findOneByComponentId({
      reqId: "leylaWorkersController_",
      cmpId: pendingComponent.ComponentID,
    });

    let existingAvailableQuantityInStock = 0;
    if (Array.isArray(stocks) && stocks.length > 0) {
      existingAvailableQuantityInStock = stocks[0].availablequantity || 0;
    }
    const newAvailableQuantityToBeUpdated =
      pendingComponentInventoryDetailsPTE.QuantityInStock -
      existingAvailableQuantityInStock;

    let exisitngReorderQuantityInStock = 0;
    if (Array.isArray(stocks) && stocks.length > 0) {
      exisitngReorderQuantityInStock = stocks[0].orderedquantity || 0;
    }
    const newReorderQuantityToBeUpdated =
      pendingComponentInventoryDetailsPTE.ReorderQuantity -
      exisitngReorderQuantityInStock;
    const productsToBeStoredInStore = await createStoreProductsFromLeylaInventoryForAComponent(
      {
        ComponentID: pendingComponent.ComponentID,
        newAvailableQuantity: newAvailableQuantityToBeUpdated,
        newReorderQuantity: newReorderQuantityToBeUpdated,
      }
    );

    await stockService.addProductsTx(productsToBeStoredInStore);
    console.log(
      `Added ComponentID: ${pendingComponent.ComponentID} ###########################################\n\n`
    );
  }
  console.log('Just completed a sync cycle. Adding a timestamp for it.');
  // then store the timespamp in inventorySync table.
  await addToProductSync();
};

const createStoreProductsFromLeylaInventoryForAComponent = async (options) => {
  let storeProducts = [];

  if (options.newAvailableQuantity == 0 && options.newReorderQuantity == 0) {
    console.log("nothing to add for quantity or ordered as both are zero.");
    return storeProducts;
  }

  const inventoryDetailsForComponent = await leylaService.getInventoryDetailsForAComponent(
    options
  );
  if (
    !Array.isArray(inventoryDetailsForComponent) ||
    inventoryDetailsForComponent.length == 0
  ) {
    console.error(
      "what is wrong with inventoryDetailsForComponent! Unable to find its data in PO details table. Cant do anything.",
      inventoryDetailsForComponent
    );
    return storeProducts;
  }
  const item = inventoryDetailsForComponent[0];

  if (options.newAvailableQuantity > 0) {
    for (let index = 0; index < options.newAvailableQuantity; index++) {
      const product = createPTEToStoreProductMapping({
        status: SConst.PRODUCT.STATUS.AVAILABLE,
        item: item,
      });
      storeProducts.push(product);
    }
  } else if (options.newAvailableQuantity < 0) {
    //TODO: we have to update stock quantity and mark products as deleted (some new PTE state)
    console.error(
      "TODO:quantity we have to update stock quantity and mark products as deleted (some new PTE state)"
    );
  }

  if (options.newReorderQuantity > 0) {
    for (let index = 0; index < options.newReorderQuantity; index++) {
      const product = createPTEToStoreProductMapping({
        status: SConst.PRODUCT.STATUS.ORDERED,
        item: item,
      });
      storeProducts.push(product);
    }
  } else if (options.newReorderQuantity < 0) {
    //TODO: we have to update stock quantity and mark reordered as deleted (some new PTE state)
    console.error(
      "//TODO:reordered  we have to update stock quantity and mark reordered as deleted (some new PTE state)"
    );
  }
  return storeProducts;
};

const addToProductSync = async () => {
  const inventoryLog = await leylaService.getPTEInventoryTS();
  await service.createProductSyncTimeStamp({
    recordDSN: inventoryLog.RecordDSN,
  });
};

module.exports = {
  productSyncWorkerStart: productSyncWorkerStart,
};
