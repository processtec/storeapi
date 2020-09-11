#!/usr/bin/env node

/*jslint node: true */
"use strict";
// --- imports
const bunyan = require('bunyan');
let _logger = null;

const getLogger = () => {
    if (_logger === null) {
        // _logger = bunyan.createLogger({name: "storeapi", src:true, level:'TRACE'});
        _logger = bunyan.createLogger({
            name: "storeapi",
            src: true,
            level: 'TRACE',
            streams: [{
                type: 'rotating-file',
                level: 'trace',
                path: 'logs/storeapi.log', // log ERROR and above to a file
                period: '1d', // daily rotation
                count: 3, // keep 3 back copies
                totalFiles: 10, // keep 10 back copies
                threshold: '10m', // Rotate log files larger than 10 megabytes
                totalSize: '20m', // Don't keep more than 20mb of archived log files
            }]
        });
    }

    return _logger;
};

module.exports = {
    logger: getLogger
};