#!/usr/bin/env node

/*jslint node: true */
"use strict";

const { ocById, ocByQuery } = require("../../services/search/ocSearchService");
const errorRes = require("../../../lib/error/storeError");
const { SConst } = require("../../constants/storeConstants");

const logger = require("../../../lib/logger/bunyanLogger").logger("");

const getOC = async (req, res) => {
  logger.info(
    {
      id: req.id,
      odID: req.params.id,
    },
    "GET od by id."
  );
  const ocID = Number(req.params.id);
  if (!Number.isInteger(ocID)) {
    return res.send(
      errorRes("oc id should be an integar!", "path", "stack", "code")
    );
  }

  const oc = await ocById({
    reqID: req.id,
    ocID: ocID,
  });
  const result = sanitizedOC(oc);
  return res.send(result); //TODO parse them before sending
};

const searchOC = async (req, res) => {
  logger.info(
    {
      id: req.id,
      query: req.query,
    },
    "Search OC by query."
  );
  const query = req.query.q;
  if (query.length < 3) {
    return res.send(
      errorRes("query should have at least 3 chars!", "path", "stack", "code")
    );
  }

  const ocs = await ocByQuery({
    reqID: req.id,
    query: query,
  });
  const result = sanitizedOC(ocs);
  return res.send(result); //TODO parse them before sending
};

const sanitizedOC = (ocs) => {
  let result = [];
  for (let index = 0; index < ocs.length; index++) {
    let oc = ocs[index]._source;
    result.push(oc);
  }
  return result;
};

module.exports = {
  getOC,
  searchOC,
};
