#!/usr/bin/env node

/*jslint node: true */
"use strict";

const sender = require('../../../lib/util/responseSender');
const service = require('../../services/session/sessionService');
const errorRes = require('../../../lib/error/storeError');
const {
    SConst
} = require('../../constants/storeConstants');

const logger = require('../../../lib/logger/bunyanLogger').logger('');

const create = async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const result = await service.create({
        username: username,
        password: password
    })

    return sender.send(res, result);
};

const validate = async (req, res) => { // do we need this route, because token has been already valiadated by tokenValaidatoer by now // TODO
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    const result = await service.validate(token);
    return res.send({
        verified: result
    });
};

const refresh = async (req, res) => {
    const username = req.body.username
    const token = req.body.refreshToken
    const result = await service.refresh({
        username: username,
        token: token
    })

    res.send(result);
};

const destroy = async (req, res) => {
    const username = req.body.username
    const token = req.body.token
    const result = await service.destroy({
        username: username,
        token: token
    })

    res.send(result);
};

module.exports = {
    create,
    validate,
    refresh,
    destroy
};