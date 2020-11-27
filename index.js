#!/usr/bin/env node

/*jslint node: true */
"use strict";

const server = require('./lib/server/expressServer');
const { db } = require('./lib/db/mysql2'); // called to initializer DB connections
const search = require('./lib/search/es');
const log = require('./lib/logger/bunyanLogger').logger('index');
const { componentById } = require('./app/services/search/componentsSearchService');
const leylaInventoryWorker = require('./app/useCases/workers/leylaWorkersController');
const leylaOCWorker = require('./app/useCases/workers/leylaOCWorkerController');


const testWareHouse = require('./app/services/db/warehouseService'); // TODO remove me
const testSite = require('./app/services/db/sitesService');

(function() {
  log.debug("initialized, starting server...");
  server.start();
  log.debug("service is up and running.");

//   testWareHouse.findAll();
  // testSite.findOne(1);
  // testSite.findAll();
  // testSite.deactivate(1);
  // testSite.update('3', 'crazy quazi', 'quazi');

  
//   search.test();
    // componentById({
    //     cmpId: 1234
    // });

    leylaInventoryWorker.productSyncWorkerStart();
    leylaOCWorker.ocSyncWorkerStart();
})();

process.on('SIGINT', function() {
  //call DB disconnet disconnet TODO
  server.stop();
  throw new Error("my module xx condition failed");
});

process.on('warning', (warning) => {
  console.error('Warning from node:--> ',warning.stack);
});
