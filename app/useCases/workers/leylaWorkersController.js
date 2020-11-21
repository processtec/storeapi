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
const cartService = require("../../services/db/cartService");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
// 5 minutes: 5 * 60 * 1000;
// 5 seconds: 1 * 5 * 1000;
const waitTime = 1 * 60 * 1000;
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
  logger.debug("Scheduling timer now for PTE inventory sync.....");
  pteInventorySyncInterval = setInterval(function () {
    logger.debug("running PTE inventory sync after waiting NOW!");
    syncPTEInventory();
  }, waitTime);
  logger.debug(
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
    logger.debug(
      "Getting data for a pending component with componentId: ",
      pendingComponent.ComponentID
    );
    const pendingComponentInventoryDetailsPTE = await leylaService.getInventoryForAComponent(
      {
        ComponentID: pendingComponent.ComponentID,
      }
    );
    logger.debug(
      "pending inventoryForAComponentInPTE: " +
        pendingComponent.ComponentID +
        ":--> ",
      pendingComponentInventoryDetailsPTE
    );
    if (
      pendingComponentInventoryDetailsPTE === null ||
      pendingComponentInventoryDetailsPTE === undefined
    ) {
      logger.error(
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
        stock: stocks[0]
      }
    );

    await stockService.addProductsTx(productsToBeStoredInStore);
    logger.debug(
      `Added ComponentID: ${pendingComponent.ComponentID} ###########################################\n\n`
    );
  }

  if (pendingComponentsInPTEInventory.length > 0) {
    logger.debug('Just completed an Inventory sync cycle. Adding a timestamp for it.');
    // then store the timespamp in inventorySync table.
    await addToProductSync();
  } else {
    logger.debug('There is nothing to sync for PTE inventory.');
  }
  
};

const createStoreProductsFromLeylaInventoryForAComponent = async (options) => {
  options.reqId = "syncworker_PTE_inventory";
  options.userName = "pmann";
  options.userId = 100000;
  let storeProducts = [];

  if (options.newAvailableQuantity == 0 && options.newReorderQuantity == 0) {
    logger.debug("nothing to add for quantity or ordered as both are zero.");
    return storeProducts;
  }

  const inventoryDetailsForComponent = await leylaService.getInventoryDetailsForAComponent(
    options
  );
  if (
    !Array.isArray(inventoryDetailsForComponent) ||
    inventoryDetailsForComponent.length == 0
  ) {
    logger.error(
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
    await cartService.deleteProductsAfterSyncWithPTE(options, SConst.PRODUCT.STATUS.PTE_AVAILABLE_DELETED);
    logger.debug(
      `Deleted ${options.newAvailableQuantity} available products from store products :-(.`
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
    await cartService.deleteProductsAfterSyncWithPTE(options, SConst.PRODUCT.STATUS.PTE_ORDERED_DELETED);
    logger.debug(
      `Deleted ${options.newAvailableQuantity} reordered products from store products this could be they are available now.`
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
