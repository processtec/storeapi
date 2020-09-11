#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    Coeus
} = require('../../../lib/search/es');
const {
    SConst
} = require('../../constants/storeConstants');

const componentById = async (options) => {

    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                query: {
                    match: {
                        componentid: options.cmpId
                    }
                }
            }

            /*body: {
                query: {
                    multi_match: {
                        query: 'Actuator BB 304 EXT EMJ Metals',
                        type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                    }
                }
            }*/
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: Fetched component by ID.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsSearched = async (options) => {

    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            body: {
                query: {
                    multi_match: {
                        query: options.q,
                        type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                    }
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: component searched with query.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsAll = async (options) => {
    const config = options || {};
    const from = config.from || 0;
    const size = config.size || 20;
    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            from: from,
            size: size,
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: All components.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsCount = async () => {
    try {
        const result = await Coeus.count({
            index: SConst.ES.INDEX_COMPONENTS,
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.count
        }, "Coeus: total components.");
        return result.body.count;
    } catch (error) {
        throw error;
    }
};

/*const components = async (id) => {
    Coeus.search({
        index: 'complete_05_29_2020_index',
        // size: 5,
        body: {
            query: {
                multi_match: {
                    query: 'Actuator BB 304 EXT EMJ Metals',
                    type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                    fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                }
            }
        }
    }, (err, result) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log("result from taxonomy==> ", result.body.hits.hits);
        return result.body.hits.hits;
    });
};*/

module.exports = {
    componentById,
    componentsSearched,
    componentsAll,
    componentsCount
};
