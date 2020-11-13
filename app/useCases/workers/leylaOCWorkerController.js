#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const sender = require("../../../lib/util/responseSender");
const errorRes = require("../../../lib/error/storeError");
const { SConst } = require("../../constants/storeConstants");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const ocService = require('../../services/search/ocSearchService');
// 5 minutes: 5 * 60 * 1000;
// 5 seconds: 1 * 5 * 1000;
const waitTime = 1 * 5 * 1000;
let leylaOCSyncInterval;

const leylaService = require("../../services/db/leylaOCService"); //TODO
// working HERE
// Similar to inventory we have to have a worker checking OCSync table and fetch from the leyla and feed to 
// OC index in ElasticsearchClientError.

const ocSyncWorkerStart = async () => {

     // get timestapms from store OC sync table
  const lastTimeStamp = await service.lastOCSyncTimeStamp();
  if (lastTimeStamp === null) {
    // TODO: dont need it now as we have a basic ES sync we use Logstash for that.
  }

  await runOCSyncDaemon();
};

const runOCSyncDaemon = async () => {
    console.log("Scheduling timer now for PTE OC sync.....");
    pteInventorySyncInterval = setInterval(function () {
      console.log("running PTE OC sync after waiting NOW!");
      syncPTEOC();
    }, waitTime);
    console.log(
      `Timer scheduled for PTE OC sync. Will run after: ${waitTime}. ZZZZzzzzzz`
    );
  };

  const syncPTEOC = async () => {
    const lastSync = await service.lastOCSyncTimeStamp();

    /* below func should do:
    SELECT Och.OrderConfirmationID, Och.CustomerQuoteID, Och.OrderConfirmationCode, Och.ProjectSiteID,
    Och.JobID, Och.Title, Och.CustomerReferenceNumber, Och.ProjectSiteAddress, Och.ContactInfo, Och.TermsOfService,
    Och.Exclusions, Och.CreateDate, Och.ShipDate, Och.DeliveryDate, Och.LastModifiedDate, Och.LastModifiedBy,
    Och.Comments, Och.ContactUserDSN, Och.CurrencyTypeID,
	Jobs.CostCenterID, Jobs.JobName,
	PS.DocumentFolder
  FROM [EData3_ProcessTec].[Project].[OrderConfirmationHeader] as Och
	INNER JOIN  [EData3_ProcessTec].[Project].[Jobs] as Jobs ON Jobs.JobID = Och.JobID
	INNER JOIN [EData3_ProcessTec].[Project].[ProjectSite] as PS ON PS.ProjectSiteID = Och.ProjectSiteID
	where Och.OrderConfirmationID > 1011
    */
    const pendingOCsInPTE = await leylaService.getOCs(
        {
            lastTimeStamp: lastSync.syncedTimestamp,
            orderConfirmationID: lastSync.OrderConfirmationID,
        }
    );

    // TODO: more logic
    for (let index = 0; index < pendingOCsInPTE.length; index++) {
        const oc = pendingOCsInPTE[index];
        const options = {
            reqId: "syncworker_PTE_OC",
            userName: "pmann",
            userId: 100000,
            oc: oc
        };
        
        await ocService.createOC(options);
    }

    // then store the timespamp and recordDSN in inventorySync table.
    await addToOCSync();
  };

  const addToOCSync = async () => {
    const iocLog = await leylaService.getLastOCHeader();
    await service.createOCSyncTimeStamp({
        orderConfirmationID: iocLog.orderConfirmationID,
    });
  };

module.exports = {
    ocSyncWorkerStart: ocSyncWorkerStart,
};