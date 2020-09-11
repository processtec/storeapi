#!/usr/bin/env node

/*jslint node: true */
"use strict";

const {
    SConst
} = require('../../app/constants/storeConstants');

const isRoleValid = (expectedRole, decodedRole) => {
  if ( !Number.isInteger(expectedRole) 
        || !Number.isInteger(decodedRole) 
        || (decodedRole > expectedRole) ) {
    return false;
  }
  
  return true;
}


module.exports = {
  isRoleValid
}
