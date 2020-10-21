#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
// const logger = require('../../../lib/logger/bunyanLogger').logger('');
const { db, initialize } = require("../../../lib/db/leylaDB");
const { SConst } = require("../../constants/storeConstants");
const moment = require("moment");

const InventoryID = 63;

const startProductSyncWorker = async (options) => {
  await initialize(); // ensures that the pool has been created
  // Get all inventory data from PTE Inventory.
  const allInventory = await getAllInventory();
  runEveryX();
};

const runEveryX = () => {
  console.log("Scheduling timer now .....");
  setTimeout(function () {
    console.log("running after waiting NOW!");

    callAllFuncs();

    //runEveryX(); //TODO enable it.
  }, waitTime);
  console.log(`Timer scheduled. Will run after: ${waitTime}. ZZZZzzzzzz`);
};

const callAllFuncs = async () => {
  const pteLatestChangeTimeStamp = await getPTEInventoryTS();
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
  }
};

const getAllInventory = async () => {
  try {
    console.log("Getting all inventory...");

    const request = db.request(); // or: new sql.Request(pool1)
    const InventoryID = 63;

    // const result = await request.query(`SELECT [InventoryItemID] ,[InventoryID] ,[ComponentID] ,[QuantityInStock] ,[ReorderQuantity] ,[Location] ,[Comments] ,[StockRoomLabel] ,[InstalledBaseCount] ,[StockBase] ,[EstimatedCost] ,[SupplierPartNumber] ,[SAPNumber] ,[CostCurrencyType] FROM [EData3_ProcessTec].[Project].[InventoryItems] WHERE [InventoryID] = ${InventoryID}`);
    const result = await request.query(
      `SELECT DISTINCT inItems.ComponentID
      ,inItems.InventoryItemID
      ,inItems.InventoryID
      ,inItems.QuantityInStock
      ,inItems.ReorderQuantity
      ,inItems.Location
      ,inItems.Comments
      ,inItems.StockRoomLabel
      ,inItems.InstalledBaseCount
      ,inItems.StockBase
      ,inItems.EstimatedCost
      ,inItems.SupplierPartNumber
      ,inItems.SAPNumber
      ,inItems.CostCurrencyType
      ,PODetail.PurchaseOrderDetailID
      ,PODetail.PurchaseOrderID
      ,PODetail.QuantityOrdered
      ,PODetail.QuantityReceived
      ,PODetail.UnitPrice
      ,PODetail.LastModifiedDate
      ,PODetail.Miscellaneous
      ,PODetail.DiscountPercent
      ,PODetail.ItemNumber
      ,POHeader.ProjectSiteID
      ,POHeader.JobID
      ,POHeader.SupplierID
      ,POHeader.CostTypeID
      ,POHeader.PurchaseOrderCode
      ,POHeader.ProjectName
      ,Supp.CompanyName as SupplierCompany
  FROM [EData3_ProcessTec].[Project].[InventoryItems] as inItems
  INNER JOIN [EData3_ProcessTec].[Project].[PurchaseOrderDetail] as PODetail ON PODetail.ComponentID = inItems.ComponentID
  INNER JOIN [EData3_ProcessTec].[Project].[PurchaseOrderHeader] as POHeader ON POHeader.PurchaseOrderID = PODetail.PurchaseOrderID
  INNER JOIN [EData3_ProcessTec].[Cmp].[Suppliers] as Supp ON Supp.SupplierID = POHeader.SupplierID

   WHERE inItems.InventoryID = ${InventoryID}
  ORDER BY PODetail.LastModifiedDate DESC`
    );
    // TODO: from above remove --> AND inItems.ComponentID = 7115, 17547
    // console.log("All inventory: ", result.recordset);
    return result.recordset;
  } catch (err) {
    console.error("SQL error", err);
    return null;
  } finally {
    // pool1.close();
  }
};

const getPTEInventoryTS = async () => {
  try {
    console.log("Getting PTEInventoryTS...");

    const request = db.request(); // or: new sql.Request(pool1)
    const InventoryID = 63;

    const result = await request.query(
      `SELECT MAX([RecordDateTime]) as RecordDateTime FROM [EData3_ProcessTec].[Project].[InventoryLog] where [InventoryID] = ${InventoryID}`
    );
    console.log("PTEInventoryTS: ", result.recordset);
    return result;
  } catch (err) {
    console.error("SQL error", err);
  } finally {
    // pool1.close();
  }
};

const getComponentsWithDSN = async (options) => {
  try {
    console.log("Getting ComponentsWithDSN...");

    const request = db.request(); // or: new sql.Request(pool1)
    const InventoryID = 63;
    const lastTimeStamp = options.lastTimeStamp || "2020-10-04 01:12:33.807"; //TODO use me

    const result = await request.query(
      `SELECT DISTINCT [ComponentID] ,MAX([RecordDSN]) as RecordDSN FROM [EData3_ProcessTec].[Project].[InventoryLog] where [InventoryID] = ${InventoryID} AND [RecordDateTime] > '2020-10-04 01:12:33.807'  group by [ComponentID]`
    );
    console.log("All ComponentsWithDSN: ", result.recordset);
    return result.recordset;
  } catch (err) {
    console.error("SQL error", err);
  } finally {
    // pool1.close();
  }
};

const getInventoryForAComponent = async (options) => {
  try {
    console.log("Getting for a InventoryForAComponent: " + options.ComponentID);

    const request = db.request(); // or: new sql.Request(pool1)
    const InventoryID = 63;
    const lastTimeStamp = "2020-10-04 01:12:33.807";

    const result = await request.query(
      `SELECT [InventoryItemID] ,[InventoryID] ,[ComponentID] ,[QuantityInStock] ,[ReorderQuantity] ,[Location] ,[Comments] ,[StockRoomLabel] ,[InstalledBaseCount] ,[StockBase] ,[EstimatedCost] ,[SupplierPartNumber] ,[SAPNumber] ,[CostCurrencyType] FROM [EData3_ProcessTec].[Project].[InventoryItems] WHERE [InventoryID] = ${InventoryID} AND [ComponentID] = ${options.ComponentID}`
    );
    console.log("InventoryForAComponent: ", result.recordset[0]);
    return result.recordset[0];
  } catch (err) {
    console.error("SQL error", err);
  } finally {
    // pool1.close();
  }
};

module.exports = {
  startProductSyncWorker: startProductSyncWorker,
  getAllInventory: getAllInventory,
  initialize: initialize
};

/*async function messageHandler() {
    await pool1Connect; // ensures that the pool has been created
    try {
      console.log('11111111');
      // https://stackoverflow.com/a/40636159/824261
      console.log(moment.utc('2020-10-04 01:12:33.807', "YYYY-MM-DD HH:mm:ss.SSS").toDate());
        const request = pool.request(); // or: new sql.Request(pool1)
        const InventoryID  = 63;
       //  const result = await request.query(`SELECT MAX([RecordDateTime]) as RecordDateTime
       // FROM [EData3_ProcessTec].[Project].[InventoryLog] where [InventoryID] = ${InventoryID}`);
       const result = await request.query(`SELECT DISTINCT [ComponentID] ,MAX([RecordDSN]) as RecordDSN FROM [EData3_ProcessTec].[Project].[InventoryLog] where [InventoryID] = ${InventoryID} AND [RecordDateTime] > '2020-10-04 01:12:33.807'  group by [ComponentID] ORDER BY RecordDSN DESC`);
        console.log('results: ', result.recordset);
        return result;
    } catch (err) {
        console.error('SQL error', err);
    } finally {
        // pool1.close();
    }
}*/
//  2020-10-04 01:12:33.807
//  YYYY-MM-DD HH:MM:SS.

// run code every 5 minutes --> https://stackoverflow.com/a/8012484/824261

const initialCall = async () => {
  await initialize(); // ensures that the pool has been created
  // Get all inventory data from PTE Inventory.
  const allInventory = await getAllInventory();
  runEveryX();
};

// run on worker thread: https://nodesource.com/blog/worker-threads-nodejs/
// OR -> https://medium.com/@Trott/using-worker-threads-in-node-js-80494136dbb6

// (function() {

//   // messageHandler();
//   initialCall();
// })();

// another way of writing above
// (() => {
//   // messageHandler();
//   initialCall();
// })();
