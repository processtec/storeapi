#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    OC
} = require('../../../lib/search/es');
const {
    SConst
} = require('../../constants/storeConstants');

const ocById = async (options) => {

    try {
        const result = await OC.search({
            index: 'och_aug_21_2020_index',
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
            index: 'och_aug_21_2020_index',
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

module.exports = {
    ocById,
    ocByQuery
};
