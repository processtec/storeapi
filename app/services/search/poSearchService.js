#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const { PO } = require("../../../lib/search/es");
const { SConst } = require("../../constants/storeConstants");
const config = require("config");
const indexName = config.get("ES.INDEX_PO");

const poById = async (options) => {
  try {
    const result = await PO.search({
      index: indexName,
      body: {
        query: {
          match: {
            purchaseorderid: options.poID,
          },
        },
      },
    });

    logger.info(
      {
        id: options.reqId,
        result: result.body.hits.hits,
      },
      "Coeus: PO by id"
    );
    return result.body.hits.hits;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const poByQuery = async (options) => {
  try {
    const result = await PO.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: options.query,
            // type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
            type: "cross_fields",
            fields: ["purchaseordercode", "jobname", "costcenterid"],
          },
        },
      },
    });

    logger.info(
      {
        id: options.reqId,
        result: result.body.hits.hits,
      },
      "Coeus: PO by query"
    );
    return result.body.hits.hits;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = {
  poById,
  poByQuery,
};
