#!/usr/bin/env node

/*jslint node: true */
"use strict";

const bcrypt = require('bcrypt'); //TODO move to a common util
const saltRounds = 10;


const getDigest = async (options) => {
  const hashedPassword = await bcrypt.hash(options.password, saltRounds);
  return hashedPassword;
};

const isPasswordMatch = async (options) => {
  const isMatched = await bcrypt.compare(options.password, options.dbDigest);
  return isMatched;
};


module.exports = {
  getDigest,
  isPasswordMatch
};
