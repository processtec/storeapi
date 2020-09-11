#!/usr/bin/env node

/*jslint node: true */
"use strict";

const errorResponse = (message, path, stack, code) => {
    if (!message) {
        throw new Error('Message missing.');
    }

    if (!path) {
        throw new Error('Path missing.');
    }

    return {
        error: {
            message,
            path,
            stack,
            code
        }
    };
};

module.exports = errorResponse;