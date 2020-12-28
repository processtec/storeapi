#!/usr/bin/env node

/*jslint node: true */
"use strict";

const search = require("../../../services/search/componentsSearchService");
const service = require("../../../services/db/dbInitializationService");
const errorRes = require("../../../../lib/error/storeError");
const { SConst } = require("../../../constants/storeConstants");

const logger = require("../../../../lib/logger/bunyanLogger").logger("");

const initComponents = async (req, res) => {
  logger.info(
    {
      id: req.id,
    },
    "initializing DB..."
  );
  const totalComponents = await search.componentsCount();

  const size = 10;
  const pages = 1; //TODO change it to--> Math.ceil(totalComponents / size);
  let from = 0;

  //TODO: Dont want it to run in parallel as of now. Do we need it??
  for (let i = 0; i < pages; i++) {
    const pagedComponents = await search.componentsAll({
      reqId: req.id,
      from: from,
      size: size,
    });

    const sanitizedComponents = sanatizeComponents(pagedComponents);

    const insertResult = await service.addComponents({
      sanitizedComponents: sanitizedComponents,
    });

    from = from + size;
  }

  return res.send({
    initialize: "components: " + totalComponents,
  });
};

const sanatizeComponents = (components) => {
  let sanatizeComponents = [];
  components.forEach((component, i) => {
    const sanatizedComponent = [
      component._source.componentid,
      component._source.mfgmodelnumber,
    ];

    sanatizeComponents.push(sanatizedComponent);
  });

  return sanatizeComponents;
};

module.exports = {
  initComponents,
};
