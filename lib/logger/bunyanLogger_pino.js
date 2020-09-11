#!/usr/bin/env node

/*jslint node: true */
"use strict";
// --- imports
const pino = require('pino');
// const fileLogger = pino(pino.destination({ dest: '/log/path', sync: false }))

const dest = pino.destination({ dest: 'pino.log', sync: false });
dest[Symbol.for('pino.metadata')] = true;
// const logger = pino(dest);
let _logger = null;


const getLogger = () => {
    if (_logger === null) {
        // _logger = bunyan.createLogger({name: "storeapi", src:true, level:'TRACE'});
        
        // _logger = pino.createLogger({
        //     name: "storeapi",
        //     src: true,
        //     level: 'TRACE',
        //     streams: [{
        //         type: 'rotating-file',
        //         level: 'trace',
        //         path: 'logs/storeapi.log', // log ERROR and above to a file
        //         period: '1d', // daily rotation
        //         count: 3, // keep 3 back copies
        //         totalFiles: 10, // keep 10 back copies
        //         threshold: '10m', // Rotate log files larger than 10 megabytes
        //         totalSize: '20m', // Don't keep more than 20mb of archived log files
        //     }]
        // });
        _logger = pino(dest);
    }

    return _logger;
};

module.exports = {
    logger: getLogger
};