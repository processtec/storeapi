#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
// const logger = require('../../../lib/logger/bunyanLogger').logger('');
const { sql, db, initialize } = require("../../../lib/db/leylaDB");
const { SConst } = require("../../constants/storeConstants");
const moment = require("moment");
const { query } = require("express");

const InventoryID = 63;
const databaseName = "EData3_ProcessTec"; // EData3_ProcessTec , EData3_Test
const getAllInventory = async () => {
  try {
    console.log("Getting all inventory...");

    const request = db.request(); // or: new sql.Request(pool1)
    // const InventoryID = 63;

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
  FROM [${databaseName}].[Project].[InventoryItems] as inItems
  INNER JOIN [${databaseName}].[Project].[PurchaseOrderDetail] as PODetail ON PODetail.ComponentID = inItems.ComponentID
  INNER JOIN [${databaseName}].[Project].[PurchaseOrderHeader] as POHeader ON POHeader.PurchaseOrderID = PODetail.PurchaseOrderID
  INNER JOIN [${databaseName}].[Cmp].[Suppliers] as Supp ON Supp.SupplierID = POHeader.SupplierID

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

const startProductSyncWorker = async (options) => {
  await initialize(); // ensures that the pool has been created
  // Get all inventory data from PTE Inventory.
  const allInventory = await getAllInventory();
  runEveryX();
};

const updateInventory = async (options) => {
  //A1. Decrease the quantity in inventory -> change quantity in InventoryItems add data in InventoryLog,
  // A2. OC: [OrderConfirmationHeader] do nothing, add components in [OrderConfirmationDetail],  and nothing in OCAddendums as they can be added from PTEDATA.COM
  try {
    /* use following after testing the individual method
    console.log("updating inventory...");
    const transaction = new sql.Transaction(db);
    await new Promise(resolve => transaction.begin(resolve));
    const request = new sql.Request(transaction)
                    .input();
    const result = await request.query("UPDATE [EData3_ProcessTec].[Project].[InventoryItems] SET Quantity = @quantity WHERE InventoryID = @inventoryId AND ComponentID = @componentId");                
    await transaction.commit();
    transaction.rollback();*/
    // await new Promise(resolve => transaction.begin(resolve));
    // TODO create a transaction: https://stackoverflow.com/a/49290654/824261
    // https://medium.com/javascript-in-plain-english/querying-sql-server-in-node-js-using-async-await-5cb68acf2144

    // https://www.npmjs.com/package/mssql#asyncawait
    // Get exisiting inventory
    const existingInventory = await getInventoryForAComponent({
      ComponentID: options.ComponentID,
    });

    await updateInventoryItemsTx(options, existingInventory);
    await updateInventoryLogTx(options, existingInventory);
    await addComponentsToOC(options);
  } finally {
    // pool1.close();
  }
};

const updateInventoryItemsTx = async (options, existingInventory) => {
  try {
    const quantityInStock =
      existingInventory.QuantityInStock - options.quantity;
    // const InventoryID = 63;
    const request = db
      .request()
      .input("quantityInStock", sql.Int, quantityInStock)
      .input("inventoryId", sql.Int, InventoryID)
      .input("componentID", sql.Int, options.ComponentID);

    const result = await request.query(
      `UPDATE [${databaseName}].[Project].[InventoryItems] SET QuantityInStock = @quantityInStock WHERE InventoryID = @inventoryId AND ComponentID = @componentId`
    );
    return result.recordset;
  } catch (err) {
    console.error("updateInventoryItemsTx SQL error", err);
    return null;
  } finally {
    // pool1.close();
  }
};

const updateInventoryLogTx = async (options, existingInventory) => {
  try {
    const quantityInStock =
      existingInventory.QuantityInStock - options.quantity;
    const request = db
      .request()
      .input("quantityPrior", sql.Int, existingInventory.QuantityInStock)
      .input("quantityAfter", sql.Int, quantityInStock)
      .input("quantityDelta", sql.Int, options.quantity)
      .input("jobId", sql.Int, options.jobId)
      .input("inventoryActionTypeId", sql.Int, 3)
      .input("distributedTo", sql.VarChar, "Ricky Solis")
      .input("userID", sql.VarChar, "rickysolis")
      .input("isVoid", sql.Int, 0)
      .input("currencyExchangeRate", sql.Int, options.CurrencyConversionRate)
      .input("currencyTypeID", sql.Int, options.CurrencyTypeID)
      
      

      .input("inventoryId", sql.Int, InventoryID)
      .input("componentID", sql.Int, options.ComponentID);
    const result = await request.query(
      `INSERT INTO [${databaseName}].[Project].[InventoryLog] (InventoryID, ComponentID, InventoryActionTypeID, QuantityPrior, QuantityAfter, QuantityDelta, JobID, DistributedTo, UserID, IsVoid, CurrencyExchangeRate, CurrencyTypeID) VALUES (@inventoryId, @ComponentID, 3, @quantityPrior, @quantityAfter, @quantityDelta, @jobId, @distributedTo, @userID, @isVoid, @currencyExchangeRate, @currencyTypeID)`
    );
    return result.recordset;
  } catch (err) {
    console.error("updateInventoryLogTx SQL error", err);
    return null;
  } finally {
    // pool1.close();
  }
};

const addComponentsToOC = async (options) => {
  try {
    const request = db
      .request()
      .input("orderConfirmationId", sql.Int, options.ocId)
      .input("componentId", sql.Int, options.ComponentID)
      .input("quantity", sql.Int, options.quantity)
      .input("discountToCustomer", sql.Int, options.DiscountToCustomer)
      .input("margin", sql.Int, options.Margin)
      .input("quotedPrice", sql.Int, options.QuotedPrice)
      .input("costType", sql.Int, options.CostType)
      .input("miscellaneous", sql.VarChar, options.Miscellaneous)
      .input("toDollarConversion", sql.Int, options.ToDollarConversion)
      .input("itemNumber", sql.Int, options.ItemNumber)
      .input("shipped", sql.Int, options.Shipped)
      .input("currencyTypeID", sql.Int, options.CurrencyTypeID)
      .input("currencyConversionRate", sql.Int, options.CurrencyConversionRate)
      .input("supplierID", sql.Int, options.SupplierID);
    const result = await request.query(
      `INSERT INTO [${databaseName}].[Project].[OrderConfirmationDetail] (OrderConfirmationID, ComponentID, Quantity, DiscountToCustomer ,Margin, QuotedPrice, CostType, Miscellaneous, ToDollarConversion, ItemNumber, Shipped, CurrencyTypeID, CurrencyConversionRate, SupplierID) VALUES (@orderConfirmationID, @componentID, @quantity, @discountToCustomer ,@margin, @quotedPrice, @costType, @miscellaneous, @toDollarConversion, @itemNumber, @shipped, @currencyTypeID, @currencyConversionRate, @supplierID)`
    );
    return result.recordset;
  } catch (err) {
    console.error("addComponentsToOC: SQL error", err);
    return null;
  } finally {
    // pool1.close();
  }
};

// /////////////////////// PRIVATE ////////////////////////
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

const getPTEInventoryTS = async () => {
  try {
    console.log("Getting PTEInventoryTS...");

    const request = db.request(); // or: new sql.Request(pool1)

    const result = await request.query(
      `SELECT MAX([RecordDateTime]) as RecordDateTime FROM [${databaseName}].[Project].[InventoryLog] where [InventoryID] = ${InventoryID}`
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
    const lastTimeStamp = options.lastTimeStamp || "2020-10-04 01:12:33.807"; //TODO use me

    const result = await request.query(
      `SELECT DISTINCT [ComponentID] ,MAX([RecordDSN]) as RecordDSN FROM [${databaseName}].[Project].[InventoryLog] where [InventoryID] = ${InventoryID} AND [RecordDateTime] > '2020-10-04 01:12:33.807'  group by [ComponentID]`
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
    const lastTimeStamp = "2020-10-04 01:12:33.807";

    const result = await request.query(
      `SELECT [InventoryItemID] ,[InventoryID] ,[ComponentID] ,[QuantityInStock] ,[ReorderQuantity] ,[Location] ,[Comments] ,[StockRoomLabel] ,[InstalledBaseCount] ,[StockBase] ,[EstimatedCost] ,[SupplierPartNumber] ,[SAPNumber] ,[CostCurrencyType] FROM [${databaseName}].[Project].[InventoryItems] WHERE [InventoryID] = ${InventoryID} AND [ComponentID] = ${options.ComponentID}`
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
  initialize: initialize,
  updateInventory: updateInventory,
  addComponentsToOC: addComponentsToOC,
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
/*
const initialCall = async () => {
  await initialize(); // ensures that the pool has been created
  // Get all inventory data from PTE Inventory.
  const allInventory = await getAllInventory();
  runEveryX();
};*/

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
