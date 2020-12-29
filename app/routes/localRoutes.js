#!/usr/bin/env node

/*jslint node: true */
"use strict";

/** controllers goes here */
const edataComponents = require("../useCases/edata/logstashComponentsController");
const localUser = require("../useCases/local/user/localUserController");
const localComponent = require("../useCases/local/components/localComponentsController");
const init = require("../useCases/local/initialization/dbInitializationController");

const register = (options) => {
  const { router } = options;

  // Doesn't requires JWT

  // EDATA
  router.post("/edata/components", edataComponents.addStocks);

  // User Creation
  router.post("/username", localUser.getUserByName);
  router.post("/useremail", localUser.getUserByEmail);
  router.post("/user", localUser.addUser);

  router.put("/user", localUser.updatePassword);
  router.put("/user_force", localUser.updatePasswordForce);

  // search

  // components
  router.get("/components", localComponent.getComponents);

  // DB init

  // Components - Not in  use anymore.
  router.post("/init/components", init.initComponents);
};

module.exports = {
  register,
};
