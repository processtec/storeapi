#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    Coeus
} = require('../../../lib/search/es');
const leylaService = require('../db/leylaService');
const {
    SConst
} = require('../../constants/storeConstants');

const componentById = async (options) => {

    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                query: {
                    match: {
                        componentid: options.cmpId,
                        isinpte: true
                    }
                }
            }

            /*body: {
                query: {
                    multi_match: {
                        query: 'Actuator BB 304 EXT EMJ Metals',
                        type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                    }
                }
            }*/
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: Fetched component by ID.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const allComponentById = async (options) => {

    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            // type: '_doc', // uncomment this line if you are using Elasticsearch ≤ 6
            body: {
                query: {
                    match: {
                        componentid: options.cmpId
                    }
                }
            }

            /*body: {
                query: {
                    multi_match: {
                        query: 'Actuator BB 304 EXT EMJ Metals',
                        type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                    }
                }
            }*/
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: Fetched component by ID.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsSearched = async (options) => {

    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            size: SConst.ES.MAX_RESULTS,
            body: {
                query: {
                    multi_match: {
                        query: options.q,
                        // type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                        type: 'cross_fields', // without AND -> https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-cross-fields
                        fields: ['companyname', 'mfgmodelnumber', 'mfgpartnumber', 'sizes', 'elastomers', 'materials', 'taxonomy', 'categorydescription', 'configurationkey', 'stockroomlabel']
                    }
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: component searched with query.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsAll = async (options) => {
    const config = options || {};
    const from = config.from || 0;
    const size = config.size || 20;
    try {
        const result = await Coeus.search({
            index: SConst.ES.INDEX_COMPONENTS,
            from: from,
            size: size,
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.hits.hits
        }, "Coeus: All components.");
        return result.body.hits.hits;
    } catch (error) {
        throw error;
    }
};

const componentsCount = async () => {
    try {
        const result = await Coeus.count({
            index: SConst.ES.INDEX_COMPONENTS,
            body: {
                query: {
                    match_all: {}
                }
            }
        });

        logger.info({
            id: options.reqId,
            result: result.body.count
        }, "Coeus: total components.");
        return result.body.count;
    } catch (error) {
        throw error;
    }
};

/*const components = async (id) => {
    Coeus.search({
        index: 'complete_05_29_2020_index',
        // size: 5,
        body: {
            query: {
                multi_match: {
                    query: 'Actuator BB 304 EXT EMJ Metals',
                    type: 'best_fields', // this will convert it to dis_max-- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html#type-best-fields
                    fields: ['elastomerdescription', 'taxonomy', 'mfgmodelnumber', 'materialdescription', 'stockroomlabel', 'configurationcode']
                }
            }
        }
    }, (err, result) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log("result from taxonomy==> ", result.body.hits.hits);
        return result.body.hits.hits;
    });
};*/

const markComponentActive = async (options) => {

    try {
        const components = await allComponentById(options);
        
        if (!Array.isArray(components) || components.length < 1) { 
            logger.error({
                options: options
            }, 'Missing component!! trying to add it.');

            let newComponents = await leylaService.getComponentDetails(options);
            if (!Array.isArray(newComponents) || newComponents.length < 1) { 
                logger.error({
                    options: options
                }, 'Unable to fetch component from the inventory DB!!. Report to Admins.');
                return;
            }
            newComponents[0].isinpte = true;
            
            await addComponent({
                component: newComponents[0]
            }); 
        } else {
            await activateComponent({
                id: components[0]._id
            });
        }
        
    } catch (error) {
        throw error;
    }
};

const addComponent = async (options) => {
    try {
        const result = await Coeus.index({
            index: SConst.ES.INDEX_COMPONENTS,
            body: lowercasedKeyedComponent(options.component)
        });

        logger.info({
            id: options.reqId,
            result: result
        }, "Component: created a new component.");
        return result;
    } catch (error) {
        throw error;
    }
};

const lowercasedKeyedComponent = (component) => {
    // https://stackoverflow.com/questions/12539574/whats-the-best-way-most-efficient-to-turn-all-the-keys-of-an-object-to-lower
    let key, keys = Object.keys(component);
    let n = keys.length;
    let lowercasedComponent = {};
    while (n--) {
      key = keys[n];
      lowercasedComponent[key.toLowerCase()] = component[key];
    }

    return lowercasedComponent;
  };

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/update_examples.html
const activateComponent = async (options) => {
    try {
        const result = await Coeus.update({
            index: SConst.ES.INDEX_COMPONENTS,
            id: options.id,
            body: {
              doc: {
                isinpte: true
              }
            }
          });

          return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    componentById,
    componentsSearched,
    componentsAll,
    componentsCount,
    markComponentActive,
    addComponent
};
