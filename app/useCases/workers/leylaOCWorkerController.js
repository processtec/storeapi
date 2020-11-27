#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const sender = require("../../../lib/util/responseSender");
const errorRes = require("../../../lib/error/storeError");
const { SConst } = require("../../constants/storeConstants");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const ocService = require('../../services/search/ocSearchService');
const leylaService = require("../../services/db/leylaService"); //TODO
const syncService = require('../../services/db/syncService');
// 5 minutes: 5 * 60 * 1000;
// 5 seconds: 1 * 5 * 1000;
const waitTime = 2 * 60 * 1000;
let leylaOCSyncInterval;
// working HERE
// Similar to inventory we have to have a worker checking OCSync table and fetch from the leyla and feed to 
// OC index in ElasticsearchClientError.

const ocSyncWorkerStart = async () => {

     // get timestapms from store OC sync table
  const lastTimeStamp = await syncService.lastOCSyncTimeStamp();
  if (lastTimeStamp === null) {
    // TODO: dont need it now as we have a basic ES sync we use Logstash for that.
  }

  await runOCSyncDaemon();
};

const runOCSyncDaemon = async () => {
  logger.info("Scheduling timer now for PTE OC sync.....");
    leylaOCSyncInterval = setInterval(function () {
      logger.debug("running PTE OC sync after waiting NOW!");
      syncPTEOC();
    }, waitTime);
    logger.info(
      `Timer scheduled for PTE OC sync. Will run after: ${waitTime}. ZZZZzzzzzz`
    );
  };

  const syncPTEOC = async () => {
    const lastSync = await syncService.lastOCSyncTimeStamp();
    const pendingOCsInPTE = await leylaService.getOCWithHigherId(
        {
            lastTimeStamp: lastSync.syncedTimestamp,
            orderConfirmationID: lastSync.OrderConfirmationID,
        }
    );

    if (
      pendingOCsInPTE === null ||
      pendingOCsInPTE === undefined
    ) {
      logger.error(
        "Unable to Sync OC's are pendingOCsInPTE is null! Create an alert... TODO!" //TODO
      );
      return;
    }
    /*for (let index = 0; index < pendingOCsInPTE.length; index++) {
        const oc = pendingOCsInPTE[index];
        const options = {
            reqId: "syncworker_PTE_OC",
            userName: "pmann",
            userId: 100000,
            oc: lowercasedKeyedOC(oc)
        };
        
        const result = await ocService.createOC(options);
        console.log('Created a new OC: ', result);
    }*/

    let lowercasedOCs = [];
    for (let index = 0; index < pendingOCsInPTE.length; index++) {
      const oc = pendingOCsInPTE[index];
      lowercasedOCs.push(lowercasedKeyedOC(oc));
    }
    const options = {
      dataset: lowercasedOCs,
      eqId: "syncworker_PTE_OC",
      userName: "pmann",
      userId: 100000
    };
    const result = await ocService.createBulk(options);
    console.log('Bulk add response: ', result);

    if (lowercasedOCs.length > 0) {
      // then store the timespamp and recordDSN in inventorySync table.
      // await ocService.refreshOC();
      await addToOCSync();
    } else {
      logger.info('OC is already in Sync... Nothing new.');
    }
  };

  const addToOCSync = async () => {
    const iocLog = await leylaService.getRecentOC();
    await syncService.createOCSyncTimeStamp({
        orderConfirmationID: iocLog.OrderConfirmationID,
    });
  };

  const lowercasedKeyedOC = (oc) => {
    // https://stackoverflow.com/questions/12539574/whats-the-best-way-most-efficient-to-turn-all-the-keys-of-an-object-to-lower
    let key, keys = Object.keys(oc);
    let n = keys.length;
    let lowercasedOC = {};
    while (n--) {
      key = keys[n];
      lowercasedOC[key.toLowerCase()] = oc[key];
    }

    return lowercasedOC;
  };

module.exports = {
    ocSyncWorkerStart: ocSyncWorkerStart
};