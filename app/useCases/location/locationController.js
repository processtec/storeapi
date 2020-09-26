#!/usr/bin/env node

/*jslint node: true */
"use strict";

const service = require('../../services/db/locationService');
const errorRes = require('../../../lib/error/storeError');
const {
  SConst
} = require('../../constants/storeConstants');

const logger = require('../../../lib/logger/bunyanLogger').logger('');

const getLocation = async (req, res) => {
  logger.info('Get location for id:: ', req.params.id);
  const locationId = Number(req.params.id);
  if (!Number.isInteger(locationId)) {
    return res.send(errorRes("location id should be an integar!", "path", "stack", "code"));
  }

  const userName = req.decoded.username;
  const userId = req.decoded.id;
  const location = await service.getById({
    userId: userId,
    userName: userName,
    locationId: locationId
  });
  return res.send(location); //TODO parse them before sending
};

const getLocations = async (req, res) => {
  const warehouseId = req.body.warehouseId;
  const userName = req.decoded.username;
  const userId = req.decoded.id;

  const result = await service.getAll({
    userName: userName,
    userId: userId,
    warehouseId: warehouseId
  });
  return res.send(result); //TODO parse them before sending
};

const searchLocation = async (req, res) => {
  const userName = req.decoded.username;
  const userId = req.decoded.id;
  const query = req.query;

  const result = await service.search({
    userName: userName,
    userId: userId,
    query: query,
    reqId: req.id
  });
  return res.send(result); //TODO parse them before sending
};

const createLocation = async (req, res) => {
  const userId = req.decoded.id;
  
  const warehouseId = req.body.warehouseId;
  const name = req.body.name;
  const level = req.body.level;
  const rack = req.body.rack;
  const zone = req.body.zone;


  const result = await service.create({
    idUser: userId,
    warehouseId: warehouseId,
    name: name,
    level: level,
    rack: rack,
    zone: zone
  });
  return res.send(result); //TODO parse them before sending
};

const modifyLocation = async (req, res) => {
  logger.info({
    id: req.id,
    locationID: req.params.id
}, "Modify a location.");
  const locationId = Number(req.params.id);
  if (!Number.isInteger(locationId)) {
    return res.send(errorRes("locationId id should be an integar!", "path", "stack", "code"));
  }
  const userId = req.decoded.id;
  const userName = req.decoded.username;
  const fName = req.decoded.fName;
  const lName = req.decoded.lName;

  const warehouseId = req.body.warehouseId;
  const name = req.body.name;
  const level = req.body.level;
  const rack = req.body.rack;
  const zone = req.body.zone;

  const result = await service.updateAll({
    locationId: locationId,
    idUser: userId,
    warehouseId: warehouseId,
    name: name,
    level: level,
    rack: rack,
    zone: zone
  });
  return res.send(result); //TODO parse them before sending
};

const deleteLocation = async (req, res) => {
  logger.info({
    id: req.id,
    locationID: req.params.id
}, "delete a location.");
  const locationId = Number(req.params.id);
  if (!Number.isInteger(locationId)) {
    return res.send(errorRes("locationId id should be an integar!", "path", "stack", "code"));
  }

  const userId = req.decoded.id;
  const userName = req.decoded.username;

  const result = await service.deactivate({
    userId: userId,
    userName: userName,
    locationId: locationId
  });

  return res.send(result);
};



module.exports = {
  searchLocation,
  getLocations,
  getLocation,
  createLocation,
  modifyLocation,
  deleteLocation
};
