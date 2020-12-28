#!/usr/bin/env node

/*jslint node: true */
"use strict";

// const elasticsearch = require('elasticsearch');
const { Client } = require("@elastic/elasticsearch");

const { URL } = require("url");
const config = require("config");
const logger = require("../logger/bunyanLogger").logger("es");

// const client = new elasticsearch.Client({
// hosts: ['https://[username]:[password]@[server]:[port]/']
// });

// option 2 --> https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html
const client = new Client({
  node: {
    url: new URL(config.get("ES.URL")),
    // auth: {
    //   username: 'elastic',
    //   password: 'changeme'
    // },
    roles: {
      master: true,
      data: true,
      ingest: true,
      ml: false,
    },
  },
  name: "baap-client",
  opaqueIdPrefix: "someName::",
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: false, // https://www.elastic.co/blog/elasticsearch-sniffing-best-practices-what-when-why-how
});

//  https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/child-client.html
const Coeus = client.child({
  name: "Coeus", // https://en.wikipedia.org/wiki/Coeus
});

const PO = client.child({
  name: "PO", // https://en.wikipedia.org/wiki/Coeus
});

const OC = client.child({
  name: "OC", // https://en.wikipedia.org/wiki/Coeus
});

logger.debug("elastic: " + client.name + Coeus.name);

console.log(client.name, Coeus.name);

const test = () => {
  /* option 1
const client = new Client({
  node: 'http://localhost:9200',
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true
});*/

  // client.on('sniff', (err, result) => {
  //   logger.debug(err, result);
  // });

  /* works with asy func only
    const { body } = await client.search({
      index: 'complete_05_29_2020_index',
      // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
      body: {
        query: {
          match: { taxonomy: 'Spare Parts\Gaskets' }
        }
      }
    });

    console.log("result from taxonomy==> ",body);*/
  /* this one works
    client.search({
      index: 'complete_05_29_2020_index',
      size: 3,
      body: {
        query: {
          match: { taxonomy: 'Spare Parts\Gaskets' }
        }
      }
    }, (err, result) => {
      if (err) console.log(err);
      console.log("result from taxonomy==> ",result.body.hits.hits);
    });*/

  // /* dis_max not working working so --> https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
  try {
    Coeus.search(
      {
        index: "complete_05_29_2020_index",
        // size: 5,
        body: {
          query: {
            multi_match: {
              query: "Actuator BB 304 EXT EMJ Metals",
              type: "best_fields", // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
              fields: [
                "elastomerdescription",
                "taxonomy",
                "mfgmodelnumber",
                "materialdescription",
                "stockroomlabel",
                "configurationcode",
              ],
            },
          },
        },
      },
      (err, result) => {
        if (err) console.log(err);
        console.log("result from taxonomy==> ", result.body.hits.hits);
      }
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

// https://compose.com/articles/getting-started-with-elasticsearch-and-node/
module.exports = {
  test,
  // client //TODO we can return an array or may be a child client per index. https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/observability.html#_client_name
  Coeus,
  PO,
  OC,
  client,
};

// TODO: query -> https://www.compose.com/articles/getting-started-with-elasticsearch-and-node-js-part-3/
