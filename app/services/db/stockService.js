#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require('lodash');
const logger = require('../../../lib/logger/bunyanLogger').logger('');
const {
    db
} = require('../../../lib/db/mysql2');
const {
    SConst
} = require('../../constants/storeConstants');

const sellProductTx = async (options) => {
// cmpID, quantity, OC, username
// 1. get from products SELECT * FROM store.product where idcmp = 1234 and status = 1 ORDER BY createdOn LIMIT 3;
// 2. Enter into Transaction and TransactionDetails
// 3. Adjust quantity in stock.
// 4. Mark Products as Sold = 2;
};


// options = idcmp, idSupplier, idVendor, mpin, serialNumber, idTag, status, costPrice, salePrice, idPO, idOC, idStock, idLocation, supplierCompany, vendorCompany
const addProductTx = async (options) => {

    // TODO supplierCompany, vendorCompany --> fetch from edata3
    const supplierCompany = "TODO";
    const vendorCompany = "TODO";

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {

        //TODO: Check the type/status of product. 
        // If its ready and inspected then only update stock avaialble quantity otherwise 
        // just add to product.
        /*Ordered 0
  available 1
  Sold 2
  Damaged 3
  testing equipment 4
  repair/maintenance 5
  trials 6*/
        // 0. check if stock for this componenet already exisits.
        /*const stockSearchResult = await findOneStockByComponent(connection, options.cmpId);
        let stockResult = stockSearchResult;
        if (!stockSearchResult.idstock) {
          //create a new stock with cmp if stock entry not present.
          const stock = createStock(connection, options); 
          options.idstock = stock.idstock
          stockResult = stock;
        }*/

        let stock = await createStockIfRequired(connection, options);
        // 1. add new product with above idstock
        options.stock = stock
        await addNewProduct(connection, options);

        //2. update stock with new quantity.
        if(options.status === SConst.PRODUCT.STATUS.AVAILABLE) {
            options.lastModifiedBy = "in Future.";
            const updateStockResult = await updateStockForAddingProduct(connection, options);
        }
        
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        // Throw the error again so others can catch it.
        throw err;

    } finally {
        connection.release();
    }
};

const createStockIfRequired = async (connection, options) => {
    // 0. check if stock for this componenet already exisits.
    const stockSearchResult = await findOneStockByComponent(connection, options.cmpId);
    let stock = stockSearchResult;
    if (!(stockSearchResult && _.has(stockSearchResult, 'idstock'))) {
        //create a new stock with cmp if stock entry not present.
        const {
            idstock
        } = await create(connection, options);
        const stockSearchResult = await findOneStockByComponent(connection, options.cmpId);

        if (!(stockSearchResult && _.has(stockSearchResult, 'idstock'))) {
            throw new Error("unable to create a stock for cmponent: " + options.cmpId);
        }

        stock = stockSearchResult;
    }
    return stock;
};

const addNewProduct = async (connection, options) => {
    logger.debug("adding a new product.");

    let result;
    try {
        const [rows, fields] = await connection.query('INSERT INTO product SET idcmp = ?, idsupplier = ?, idvendor = ?, mpin = ?, status = ?, costprice = ?, idpo = ?, idstock = ?, idlocation = ?', [options.cmpId, options.idSupplier, options.idVendor, options.mpin, options.status, options.costPrice, options.idPO, options.stock.idstock, options.idLocation]);
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "new product added.");
    } catch (e) {
        // TODO return error
        logger.error(e);
        throw e;
    } finally {
        return result;
    }

};

const updateStockForAddingProduct = async (connection, options) => {
    logger.debug("updating a stocked item in stocks for idcmp...");
    const availablequantity = options.stock.availablequantity > 0 ? (options.stock.availablequantity + 1) : 1;
    const orderedquantity = options.stock.orderedquantity > 0 ? (options.stock.orderedquantity - 1) : 0;

    const maximumquantity = options.stock.maximumquantity < availablequantity; // TODO send an alert. Do I need a new alert table?

    let result;
    try {
        const [rows, fields] = await connection.query('UPDATE stock SET availablequantity = ?, orderedquantity = ?, lastModifiedBy = ? where idstock = ?', [availablequantity, orderedquantity, options.lastModifiedBy, options.stock.idstock]);
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "Stock updated for a component.");
    } catch (e) {
        // TODO return error
        logger.error(e);
        throw err;
    } finally {
        return result;
    }
};

const findOneStockByComponent = async (connection, id) => {
    logger.debug("will be returning stock for idcmp...");

    let result;
    try {
        const [rows, fields] = await connection.execute('SELECT * from stock where idcmp = ? LIMIT 0, 1', [id]);
        if (!Array.isArray(rows)) {
            throw new Error("Result of searching a cmponent isn't an array");
        }
        result = rows[0];
        logger.info({
            id: options.reqId,
            result: result
        }, "found a stock");
    } catch (e) {
        // TODO return error
        logger.error(e);
        throw e;
    } finally {
        return result;
    }
};

// idcmp, price, availablequantity, minimumquantity, orderedquantity, maximumquantity
const create = async (connection, options) => {
    logger.debug("creating a new default stock item...");

    let result;
    try {
        const [rows, fields] = await connection.query('INSERT INTO stock SET idcmp = ?', [options.cmpId]);
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "New Stock created.");
    } catch (e) {
        // TODO return custom errors.
        logger.error(e);
        throw err;
    } finally {
        return {
            idstock: result.insertId
        };
    }
};
// ==========================




const updateAll = async (id, idcmp, price, availablequantity, minimumquantity, orderedquantity, maximumquantity) => {
    logger.debug("updating a stocked item in stocks...");

    let result;
    try {
        const [rows, fields] = await db.query('UPDATE stock SET idcmp = ?, price = ?, availablequantity = ?, minimumquantity = ?, orderedquantity = ?, maximumquantity = ? where idstock = ?', [idcmp, price, availablequantity, minimumquantity, orderedquantity, maximumquantity, id]);
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "Stock updated.");
    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const updateForComponent = async (idcmp, price, availablequantity, minimumquantity, orderedquantity, maximumquantity) => {
    logger.debug("updating a stocked item in stocks for idcmp...");

    let result;
    try {
        const [rows, fields] = await db.query('UPDATE stock SET price = ?, availablequantity = ?, minimumquantity = ?, orderedquantity = ?, maximumquantity = ? where idcmp = ?', [price, availablequantity, minimumquantity, orderedquantity, maximumquantity, idcmp]);
        result = rows;

    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const findAll = async () => {
    logger.debug("will be returning all sites now...");
    let result;
    try {
        const [rows, fields] = await db.query('SELECT * from stock');
        result = rows;
        logger.info({
            id: options.reqId,
            result: result
        }, "all stocks found.");
    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const findOneByComponent = async (id) => {
    logger.debug("will be returning stock for idcmp...");

    let result;
    try {
        const [rows, fields] = await db.execute('SELECT * from site where idcmp = ? LIMIT 0, 1', [id]);
        result = rows;
        
    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const findOne = async (id) => {
    logger.debug("will be returning stock for idstock...");

    let result;
    try {
        const [rows, fields] = await db.execute('SELECT * from site where idstock = ?', [id]);
        result = rows;
        
    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const deactivate = async (id) => {
    logger.debug("will be returning all sites now...");

    let result;
    try {
        const [rows, fields] = await db.execute('UPDATE stock SET isActive = 0 where idsite = ?', [id]);
        result = rows;
        
    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

const deactivateByComponent = async (id) => {
    logger.debug("will be deactivating stocks by idcmp...");

    let result;
    try {
        const [rows, fields] = await db.execute('UPDATE stock SET isActive = 0 where idcmp = ?', [id]);
        result = rows;

    } catch (e) {
        // TODO return error
        logger.error(e);
        result = e;
    } finally {
        return result;
    }
};

module.exports = {
    addProductTx,
    sellProductTx
    /*create,
    findAll,
    findOne,
    findOneByComponent,
    deactivate,
    deactivateByComponent,
    updateAll,
    updateForComponent*/
};