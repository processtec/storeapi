#!/usr/bin/env node

/*jslint node: true */
"use strict";

// const bcrypt = require('bcrypt'); //TODO move to a common util
// const saltRounds = 10;

const service = require('../../../services/db/userService');
const errorRes = require('../../../../lib/error/storeError');
const {
    SConst
} = require('../../../constants/storeConstants');

const logger = require('../../../../lib/logger/bunyanLogger').logger('');


const addUser = async (req, res) => {
    logger.info({
        id: req.id,
        cartId: req.body.username
    }, "Add user called.");
    const userPassword = req.body.password;
    const userName = req.body.username;
    const email = req.body.email;
    const fName = req.body.fName;
    const lName = req.body.lName;

    // const salt = await bcrypt.genSalt(20); // No need to store salt as bcrypt store them with hash
    // const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // const isValid = await bcrypt.compare(userPassword, hashedPassword);

    const result = await service.add({
        // salt: salt,
        password: userPassword,
        // digest: hashedPassword,
        userName: userName,
        email: email,
        fName: fName,
        lName: lName
    });
    return res.send(result); //TODO parse them before sending
};

const getUserByName = async (req, res) => {
    logger.info({
        id: req.id,
        userName: req.body.userName
    }, "Get user by name.");
    const userName = req.body.userName;

    const result = await service.getUserByUserName({
        userName: userName
    });
    return res.send(result); //TODO parse them before sending
};

const getUserByEmail = async (req, res) => {
    logger.info({
        id: req.id,
        email: req.body.email
    }, "Get user by email.");
    const email = req.body.email;

    const result = await service.getUserByEmail({
        email: email
    });
    return res.send(result); //TODO parse them before sending
};

const updatePassword = async (req, res) => {
    logger.info({
        id: req.id
    }, "Update password..");
    const userPassword = req.body.password;
    const newPassword = req.body.newPassword;
    const userName = req.body.username;
    const email = req.body.email;

    // const salt = await bcrypt.genSalt(20); // No need to store salt as bcrypt store them with hash
    // const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // const isValid = await bcrypt.compare(userPassword, hashedPassword);

    const result = await service.modifyPasswordWithExisting({
        password: userPassword,
        newPassword: newPassword,
        userName: userName,
        email: email
    });
    return res.send(result); //TODO parse them before sending
};


const updatePasswordForce = async (req, res) => {
    logger.info({
        id: req.id
    }, "update password.");
    const userPassword = req.body.password;
    const userName = req.body.username;
    const email = req.body.email;

    // const salt = await bcrypt.genSalt(20); // No need to store salt as bcrypt store them with hash
    // const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // const isValid = await bcrypt.compare(userPassword, hashedPassword);

    const result = await service.modifyPasswordForce({
        password: userPassword,
        userName: userName,
        email: email
    });
    return res.send(result); //TODO parse them before sending
};

module.exports = {
    addUser,
    getUserByName,
    getUserByEmail,
    updatePassword,
    updatePasswordForce
};
