#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    OC,
    client
} = require('../../../lib/search/es');
const {
    SConst
} = require('../../constants/storeConstants');
const config = require('config');
const indexName = config.get('ES.INDEX_OC');

const ocById = async (options) => {

    try {
        const result = await OC.search({
            index: indexName,
            body: {
                query: {
                    match: {
                        orderconfirmationid: options.ocID
                    }
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "OC: by id");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const ocByQuery = async (options) => {

    try {
        const result = await OC.search({
            index: indexName,
            body: {
                query: {
                    multi_match: {
                        query: options.query,
                        // type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        type: 'cross_fields',
                        fields: ['orderconfirmationcode', 'jobname', "costcenterid", 'title']
                    }
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: OC by query ");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const createOC = async (options) => {
    try {
        const result = await OC.index({
            index: indexName,
            type: 'och_type',
            body: options.oc
        });

        logger.info({
            id: options.reqId,
            result: result
        }, "OC: created new in ES.");
        return result;
    } catch (error) {
        throw error;
    }
};

const createBulk = async (options) => {
    try {
        const body = options.dataset.flatMap(doc => [{ index: { _index: indexName } }, doc]);
        const result = await client.bulk({ refresh: true, body });
        return result;
    } catch (error) {
        throw error;
    }
};



const refreshOC = async () => {
    try {
        await OC.indices.refresh({ index: indexName })
    } catch (error) {
        throw error;
    }
};

module.exports = {
    ocById,
    ocByQuery,
    createOC,
    refreshOC,
    createBulk
};
