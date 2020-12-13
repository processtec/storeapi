#!/usr/bin/env node

/*jslint node: true */
"use strict";

const _ = require("lodash");
const leylaImage = require("../../../lib/util/leylaImage");
const componentService = require("../../services/search/componentsSearchService");
const alertService = require("./alertService");
const logger = require("../../../lib/logger/bunyanLogger").logger("");
const { db } = require("../../../lib/db/mysql2");
const { SConst } = require("../../constants/storeConstants");
const stockService = require("./stockService");
const leylaService = require("./leylaService");
const ocService = require("../search/ocSearchService");
const reportService = require('./reportService');

const getById = async (options) => {
  const cart = await getCartById(options);
  if (cart.length < 1) {
    return {};
  }

  const stocks = await getDetailedStocksForACart({
    idcart: cart[0].idcart,
  });
  cart[0].stocks = stocks;

  const shipmentReportId =  await reportService.getCartShipmentTxIdFromCartId(options);
  if (Array.isArray(shipmentReportId) && shipmentReportId.length > 0) { 
    cart[0].shipmentReportId = shipmentReportId[0].idcart_tx;
  }


  return cart[0];
};

const getAll = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching all carts for user:",
    options.userName
  );
  const carts = await getCarts(options);
  /*for (let index = 0; index < carts.length; index++) {
        const cart = carts[index];
        const stocks = await getDetailedStocksForACart({
            idcart: cart.idcart
        });

        // get other details like name etc. too //TODO
        carts[index].stocks = stocks;
    }*/

  return carts;
};

const getAllWithDetails = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching all carts for user:",
    options.userName
  );
  let carts = await getCarts(options);
  for (let index = 0; index < carts.length; index++) {
    const cart = carts[index];
    const stocks = await getDetailedStocksForACart({
      idcart: cart.idcart,
    });

    // get other details like name etc. too //TODO
    carts[index].stocks = stocks;
  }

  return carts;
};

const create = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "creating a new cart for oc:",
    options.ocId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.query(
      "INSERT INTO store.cart SET idUser = ?, status = ?, fname = ?, lname = ?, idpo = ?, idOC = ?, jobname = ?, costcenterid = ?, title = ?, description = ?",
      [
        options.idUser,
        SConst.CART.STATUS.AVAILABLE,
        options.fname,
        options.lname,
        options.idpo,
        options.idoc,
        options.jobname,
        options.costcenterid,
        options.title,
        options.description,
      ]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "new cart created."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const modifyStatus = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "updating an xisting cart with id:",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.query(
      "UPDATE store.cart SET status = ? WHERE idcart = ? AND idUser",
      [options.status, options.idcart, options.idUser]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart updated"
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const deleteAll = async (options) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  let result = {
    cartsDeleted: true,
  };
  try {
    // 1. delete from cart_stock
    await deleteCartProductsForAUserTx(connection, options);

    // 2. delete from cart
    await deleteCartsForAUserTx(connection, options);

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    connection.release();
    return result;
  }
};

const deleteOne = async (options) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  let result = {
    cartDeleted: true,
  };
  try {
    // 1. delete from cart_stock
    await deleteProductsInCartTx(connection, options);

    // 2. delete from cart
    await deleteCartTx(connection, options);

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    connection.release();
    return result;
  }
};

const addProductsToCart = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "adding a new product for cartId:",
    options.cartId
  );

  if (!Array.isArray(options.cmpIds) || options.cmpIds.length < 1) {
    return {
      errorCode: 420,
      error: {
          message: 'Bad request: cmpIds must be an array.'
      }
    };
  }

  const stocks = await stockService.findStocksComponentIds(options);

  let result;
  let sql = "INSERT INTO store.cart_stock (idcart, idstock, quantity, idUser) VALUES ?";
  let values = [];
  for (let index = 0; index < stocks.length; index++) {
    const stock = stocks[index];
    const value = [options.cartId, stock.idstock, options.quantity, options.idUser];
    values.push(value);
  }

  try {
    const [
      rows,
      fields,
    ] = await db.query(
      sql, [values]      
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "added products to cart."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const addProductToCart = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "adding a new product for cartId:",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.query(
      "INSERT INTO store.cart_stock SET idcart = ?, idstock = ?, quantity = ?, idUser = ?",
      [options.cartId, options.stockId, options.quantity, options.idUser]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "added a new product."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const modifyProductForCart = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "adding a new product for cartId:",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.query(
      "UPDATE store.cart_stock SET quantity = ? WHERE idcart = ? AND idstock = ?",
      [options.quantity, options.cartId, options.stockId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "modied product for a cart."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const checkoutACart = async (options) => {
  // 0. its a Tx
  const connection = await db.getConnection();
  await connection.beginTransaction();
  let result = {
    checkout: true,
  };

  try {
    // 1. Get all stockids & quantities for a cart from cart_stock table.
    const cart = await getById(options);
    const stocks = cart.stocks || [];
    if (stocks.length < 1) {
      throw new Error("nothing much in cart to checkout!");
    }
    // 2. for Each stock id, get products with limit as quantities which are avaialble.
    let detailedMessage = ""; // message for alert service
    const orderConfirmaion = await ocService.ocById({
      reqID: options.reqId,
      ocID: options.ocId,
    });

    let isPartialShipment = false;
    let isThereSomethingToShip = false;
    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];

      if(stock.details.availablequantity > 0 
        && stock.quantity > stock.details.availablequantity) {
        
        isPartialShipment = true;
        isThereSomethingToShip = true;
        break;
      }
    }

    if (!isThereSomethingToShip) {
      return {
        errorCode: 428, // Precondition Required
        error: {
            message: 'No stock present for any product in cart! Try again later.'
        }
    }
    }

    options.isPartialShipment = isPartialShipment;
    options.ocDetails = orderConfirmaion[0]._source;
    
    // todo: create an entry in cartTx table for this.
    const reportCartTx =  await createOrUpdateReportCartTx(connection, options);
    options.reportCartId = reportCartTx;
    const reportShipmentTx = await createShipmentReport(connection, options);
    options.reportShipmentInsertId = reportShipmentTx;

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];
      const availablequantity = stock.details.availablequantity; // avaialble quantity for that product in stock table
      const requiredQuantity = stock.quantity; // quantity asked by user in cart

      if(availablequantity < 1 ) {
        // skipping it as we dont have any quantity aailable for this.
        logger.debug({
          stock: stock,
          availablequantity: availablequantity,
          requiredQuantity: requiredQuantity
        }, "skipping it as we dont have any quantity aailable for this.");
        continue;
      }

      detailedMessage = `Shipping: component: ${stock.details.idcmp}, quantity: ${availablequantity} \n`;
      
      options.availablequantity = availablequantity;
      options.requiredQuantity = requiredQuantity;
      options.stock = stock;
      //update stock quantity 
      await updateStockForCartCheckout(connection, {
        availablequantity: availablequantity,
        quantity: requiredQuantity,
        idUser: options.userId,
        idstock: stock.idstock,
      });


      await updateCartToStockWithShipmentDetails(connection, options);
      
      await createShipmentDetailsReport(connection, options);

      // NEW PTE sync step:
      // TODO ideally controller should do that instead of service calling a service or better if Manager does that.
      //A1. Decrease the quantity in inventory -> change quantity in InventoryItems add data in InventoryLog,
      
      await leylaService.updateInventory({
        availablequantity: availablequantity,
        ComponentID: stock.details.idcmp,
        ocId: options.ocId,
        quantity: requiredQuantity,
        DiscountToCustomer: 0,
        Margin: 0,
        QuotedPrice: products[0].costprice,
        CostType: 0,
        Miscellaneous: `Added from Store API for cartID: ${options.cartId}, ocId: ${options.ocId}`,
        ToDollarConversion: 0,
        ItemNumber: index + 10, //increment by 10
        Shipped: 0,
        CurrencyTypeID: 1,
        CurrencyConversionRate: 1,
        SupplierID: products[0].idsupplier,
        jobId: orderConfirmaion[0]._source.jobid,
      });
    }

    /*
    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];
      const availablequantity = stock.details.availablequantity; // avaialble quantity for that product in stock table

      const limit = stock.quantity; // quantity asked by user in cart
      const products = await getProductsForStockId(options, stock, limit);
      // 3. If quantity asked for any of the product in cart is less than available in stocks table,
      // dont discard the transaction instead do a partial checkout



      if (products.length < stock.quantity) {
        isPartialShipment = true;
        result = {
          availablequantity: availablequantity, // or products.lenght
          availableProducts: products.length,
          requestedQuantity: stock.quantity,
        };
        logger.error(result, "products not available.");

        throw new Error(
          "not enough product available for component: " + stock.details.idcmp
        );
      }

      // 4.  Enter in transaction table the stockID
      const transaction = await createTransactionTx(
        connection,
        options,
        stock,
        cart
      );

      detailedMessage = `component: ${stock.details.idcmp}, quantity: ${products.length} \n`;
      // 5.  mark each product as sold
      for (let j = 0; j < products.length; j++) {
        const product = products[j];
        // mark product as sold.
        const updatedProduct = await markAProductSold(
          connection,
          options,
          product
        );

        // 6. Enter in transaction details tables.
        // TODO: do we need to do it here or it can do it on seprate task as we will do with alerts.
        await createTransactionDetailsTx(
          connection,
          options,
          product,
          transaction,
          cart
        );
        // above one not woking....

        // TODO: Create cart transaction
      }

      //update stock quantity 
      await updateStockForCartCheckout(connection, {
        availablequantity: availablequantity,
        quantity: limit,
        idUser: options.userId,
        idstock: stock.idstock,
      });

      // NEW PTE sync step:
      // TODO ideally controller should do that instead of service calling a service or better if Manager does that.
      //A1. Decrease the quantity in inventory -> change quantity in InventoryItems add data in InventoryLog,
      await leylaService.updateInventory({
        availablequantity: availablequantity,
        ComponentID: stock.details.idcmp,
        ocId: options.ocId,
        quantity: stock.quantity,
        DiscountToCustomer: 0,
        Margin: 0,
        QuotedPrice: products[0].costprice,
        CostType: 0,
        Miscellaneous: `Added from Store API for cartID: ${options.cartId}, ocId: ${options.ocId}`,
        ToDollarConversion: 0,
        ItemNumber: index + 10, //increment by 10
        Shipped: 0,
        CurrencyTypeID: 1,
        CurrencyConversionRate: 1,
        SupplierID: products[0].idsupplier,
        jobId: orderConfirmaion[0]._source.jobid,
      });
    }*/

    if (!isPartialShipment) {
      // if not partial shipment that means mark all stocks in this table inactive
      await markCartToStockInActiveTx(connection, options);
    }

    await markCartInActiveTx(connection, options, isPartialShipment);

    // 8. TODO send an event for alert. Do we need to send it now or after the func returns and with some low level priority queue?.
    // await createAlertTx(connection, options);
    const message = `${options.userName} checked out a cart with id: ${cart.idcart}`;
    alertService.create({
      type: isPartialShipment ? SConst.ALERT.TYPE.CHECKOUT_SUCCESS : SConst.ALERT.TYPE.PARTIAL_CHECKOUT_SUCCESS,
      idUser: options.userId,
      userName: options.userName,
      message: message,
      description: `${message}. \n ${detailedMessage}`,
    });

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    // TODO return custom errors.
    logger.error(e);
    result = {
      error: e,
    };
  } finally {
    connection.release();
    return result;
  }
};

const deleteAProduct = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Deleting a product for cartId:",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.query(
      "DELETE FROM store.cart_stock WHERE idcart = ? AND idstock = ? AND idUser = ?",
      [options.cartId, options.stockId, options.userId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "product deleted."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const deleteProductsAfterSyncWithPTE = async (options, type) => {
  // its a Tx
  const connection = await db.getConnection();
  await connection.beginTransaction();
  logger.debug(
    {
      id: options.reqId,
      type: type,
      ComponentID: options.ComponentID
    },
    "Deleting products as someone deleted in PTE inventory directly."
  );
  let detailedMessage = ""; // message for alert service

  try {
    if (type == SConst.PRODUCT.STATUS.PTE_AVAILABLE_DELETED) {
      const availableQuantity = options.newAvailableQuantity * -1;
      // find products which are available in store
      const products = await getAvailableProductsForComponentId(options, availableQuantity);
      for (let index = 0; index < products.length; index++) {
        // mark it PTE available deleted   
        await markAProductPTEAvailableDeleted(connection, options, products[index]);
        detailedMessage = `deleting available component: ${options.ComponentID} and product ID is: ${products[index].idproduct}\n`;
      }

      await updateStockForPTEAvailableDeleted(connection, options);
    } else if (type == SConst.PRODUCT.STATUS.PTE_ORDERED_DELETED) {
      const reorderQuantity = options.newReorderQuantity * -1;
      const products = await getOrderedProductsForComponentId(options, reorderQuantity);
      for (let index = 0; index < products.length; index++) {
        // mark it PTE ordered deleted
        await markAProductPTEOrderedDeleted(connection, options, products[index]);
        detailedMessage = `deleting available component: ${options.ComponentID} and product ID is: ${products[index].idproduct}\n`;
      }

      await updateStockForPTEOrderedDeleted(connection, options);
    }
    

    const message = `${options.userName} deleted products in store database during a sync!`;
    alertService.create({
      type: SConst.ALERT.TYPE.ERROR_PTE_DELETE,
      idUser: options.userId,
      userName: options.userName,
      message: message,
      description: `${message}. \n ${detailedMessage}`
    });

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    // TODO return custom errors.
    logger.error(e);
  } finally {
    connection.release();
  }
};

/**
Private
*/

const createOrUpdateReportCartTx = async (connection, options) => {
  const existingCartReport = await getReportCartById(options);

  if (!Array.isArray(existingCartReport) || existingCartReport.length < 1) { 
    // create cart report
    let result = await createReportCart(connection, options);
    return result;
  } else {
    // update
  await updateReportCart(connection, options);
    return existingCartReport[0].idcart_tx;
  }

  
};

const createReportCart = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Creating a new cart report."
  );
  options.description = options.description || "Default description from code";
  options.title = options.title || "Default title from code";

  let result;
  try {
    const status = options.isPartialShipment ? SConst.REPORT_CART.STATUS.PARTIAL_COMPLETED : SConst.REPORT_CART.STATUS.COMPLETED
    const [
      rows,
      fields,
    ] = await connection.query(
      "INSERT INTO store.report_cart_tx SET idcart = ?, description = ?, title = ?, jobname = ?, idOC = ?, costcenterid = ?, fname = ?, lname = ?, status = ?, idUser = ?",
      [options.cartId, options.description, options.title, options.ocDetails.jobname, options.ocId, options.ocDetails.costcenterid, options.fName, options.lName, status, options.userId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "New cart repot created."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result.insertId;
  }
};

const updateReportCart = async (connection, options) => {
  const status = options.isPartialShipment ? SConst.REPORT_CART.STATUS.PARTIAL_COMPLETED : SConst.REPORT_CART.STATUS.COMPLETED;

  logger.debug(
    {
      id: options.reqId,
      status: status
    },
    "Updating an existing cart report.",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.report_cart_tx SET status = ? where idcart = ?",
      [status, options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "Report cart updated."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  } finally {
    return result;
  }
}

const getReportCartById = async (options) => {
  logger.debug(
    {
      id: options.reqId,
      cartId: options.cartId
    },
    "Getting a report cart for cartID"
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.report_cart_tx where idcart = ? AND status <> ?",
      [options.cartId, SConst.REPORT_CART.STATUS.DELETED]
    ); // TODO: as of now showing all reports to eveyone.
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched a report cart for a user."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const createShipmentReport = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Creating a new shipment report."
  );
  
  let result;
  try {
    const status = options.isPartialShipment ? SConst.REPORT_CART.STATUS.PARTIAL_COMPLETED : SConst.REPORT_CART.STATUS.COMPLETED
    const [
      rows,
      fields,
    ] = await connection.query(
      "INSERT INTO store.report_shipment SET idcart_tx = ?, status = ?, title = ?, description = ?",
      [options.reportCartId, status, options.title, options.description]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "New shipment repot created."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result.insertId;
  }
};

const createShipmentDetailsReport = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Creating a new shipment report."
  );
  const backOrderQuantity = options.availablequantity - options.requiredQuantity;
  let result;
  try {
    const status = options.isPartialShipment ? SConst.REPORT_CART.STATUS.PARTIAL_COMPLETED : SConst.REPORT_CART.STATUS.COMPLETED
    const [
      rows,
      fields,
    ] = await connection.query(
      "INSERT INTO store.report_shipment_details SET idreport_shipment = ?, idstock = ?, quantity = ?, shippedQuantity = ?, backOrderQuantity = ?, status = 1, idcmp = ?, saleprice = ?",
      [options.reportShipmentInsertId, options.stock.idstock, options.requiredQuantity, options.availablequantity, Math.abs(backOrderQuantity), options.stock.details.idcmp, options.stock.details.price]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "New shipment repot created."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result;
  }
};

const updateStockForCartCheckout = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "updating stock for cart checkout."
  );
  const newQuantity = options.availablequantity - options.quantity;
  // const availablequantity = newQuantity < 0 ? 0 : newQuantity; we are allowing -ve quantity
  // const maximumquantity = options.stock.maximumquantity < availablequantity; // TODO send an alert. Do I need a new alert table?

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE stock SET availablequantity = ?, lastModifiedBy = ? where idstock = ?",
      [newQuantity, options.idUser, options.idstock]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "Stock updated for a component."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result;
  }
};

const updateStockForPTEAvailableDeleted = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
      options: options
    },
    "Updating stock available quantity."
  );
  const newQuantity = options.stock.availablequantity + options.newAvailableQuantity; // newAvailableQuantity is -VE
  const availablequantity = newQuantity < 0 ? 0 : newQuantity;
  logger.debug(
    {
      availablequantity: availablequantity
    },
    "Updating stock availablequantity"
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE stock SET availablequantity = ?, lastModifiedBy = ? where idstock = ?",
      [availablequantity, options.idUser, options.stock.idstock]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        options: options
      },
      "Updated stock available quantity."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result;
  }
};

const updateStockForPTEOrderedDeleted = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
      options: options
    },
    "Updating stock ordered quantity."
  );
  const newQuantity = options.stock.orderedquantity + options.newReorderQuantity; // newReorderQuantity is -VE
  const orderedquantity = newQuantity < 0 ? 0 : newQuantity;
  logger.debug(
    {
      orderedquantity: orderedquantity
    },
    "Updating stock ordered quantity"
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE stock SET orderedquantity = ?, lastModifiedBy = ? where idstock = ?",
      [orderedquantity, options.idUser, options.stock.idstock]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        options: options
      },
      "Updated stock ordered quantity."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw err;
  } finally {
    return result;
  }
};

const createTransactionDetailsTx = async (
  connection,
  options,
  product,
  transaction,
  cart
) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "creating a new transaction details for for PO:",
    cart.idPO
  );
  let result;
  try {
    //TODO this one not working
    const [
      rows,
      fields,
    ] = await connection.query(
      'INSERT INTO store.txdetails SET idtransaction = ?, idcmp = ?, idsupplier = ?, idvendor = ?, mpin = ?, barcode = ?, status = "What..", costprice = 0.00, saleprice = 0.00, idpo = ?, idoc = ?, idproduct = ?',
      [
        transaction.insertId,
        product.idcmp,
        product.idsupplier,
        product.idvendor,
        product.mpin,
        product.idproduct,
        cart.idPO,
        options.ocId,
        product.idproduct,
      ]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "added a new transaction detail."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    throw e;
  }
};

const createTransactionTx = async (connection, options, stock, cart) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "creating a new transaction for PO:",
    options.poID
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      'INSERT INTO store.transaction SET idcmp = ?, quantity = ?, saleprice = 0.10, idpo = ?, idcustomer = "TODO", idoc = ?, salefname = ?, salelname = ?, idstock = ? ',
      [
        stock.details.idcmp,
        stock.quantity,
        cart.idPO,
        options.ocId,
        options.fName,
        options.lName,
        stock.idstock,
      ]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "new transaction created."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const markAProductSold = async (connection, options, product) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "marking product sold:",
    product.idproduct
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.product SET status = ?, lastModifiedBy = ?, isActive = 0 WHERE idproduct = ?",
      [SConst.PRODUCT.STATUS.SOLD, options.userName, product.idproduct]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "product marked sold."
    );
    return result;
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    throw e;
  }
};

const markAProductPTEAvailableDeleted = async (connection, options, product) => {
  logger.debug(
    {
      id: options.reqId,
      product: product
    },
    "Marking an available product as PTE deleted."
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.product SET status = ?, lastModifiedBy = ?, isActive = 0 WHERE idproduct = ?",
      [SConst.PRODUCT.STATUS.PTE_AVAILABLE_DELETED, options.userName, product.idproduct]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        product: product
      },
      "Marked an available product as PTE deleted."
    );
    return result;
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    throw e;
  }
};

const markAProductPTEOrderedDeleted = async (connection, options, product) => {
  logger.debug(
    {
      id: options.reqId,
      product: product
    },
    "Marking an ordered product as PTE deleted."
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.product SET status = ?, lastModifiedBy = ?, isActive = 0 WHERE idproduct = ?",
      [SConst.PRODUCT.STATUS.PTE_ORDERED_DELETED, options.userName, product.idproduct]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        product: product
      },
      "Marked an ordered product as PTE deleted."
    );
    return result;
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    throw e;
  }
};

const deleteCartProductsForAUserTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "deleting products for userId: ",
    options.userId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "DELETE FROM store.cart_stock where idUser = ? ",
      [options.userId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "product removed for a user in a cart."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  } finally {
    return result;
  }
};

const deleteCartsForAUserTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "deleting carts for userId: ",
    options.userId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query("DELETE FROM store.cart where idUser = ?", [
      options.userId,
    ]);
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "carts deleted for a user."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  } finally {
    return result;
  }
};

const deleteCartTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "deleting cartId: ",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "DELETE FROM store.cart where idcart = ? AND idUser = ?",
      [options.cartId, options.userId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart deleted."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  } finally {
    return result;
  }
};

const deleteProductsInCartTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "deleting products for cartId: ",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "DELETE FROM store.cart_stock where idcart = ? ",
      [options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "products removed from a cart"
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  } finally {
    return result;
  }
};

// const deleteProductsInCartTx = async (connection, options) => {
//   logger.debug("deleting products for cartId: ", options.cartId);
//
//   let result;
//   try {
//     const [rows, fields] = await connection.query('DELETE FROM store.cart_stock where idcart = ? ', [options.cartId]);
//     result = rows;
//     console.log('cart emptyed.', result);
//   } catch (e) {
//     // TODO return error
//     logger.error(e);
//     throw e;
//   } finally {
//     return result;
//   }
// };

const getCartById = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching cart for user:",
    options.userName
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.cart where idUser = ? AND idcart = ? AND status < ? LIMIT 0, 1",
      [options.userId, options.cartId, SConst.CART.STATUS.COMPLETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched a cart by id."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getDetailedStocksForACart = async (options) => {
  const stocks = await getStocksForCartId(options);

  for (let i = 0; i < stocks.length; i++) {
    const idStock = stocks[i].idstock;
    const stockDetails = await getStockDetailsForId({
      idStock: idStock,
    });

    const stockImages = await componentService.componentById({
      reqId: options.reqId,
      cmpId: stockDetails[0].idcmp,
    });

    stocks[i].details = stockDetails[0];
    stocks[i].details.images = leylaImage.getImages(stockImages[0]._source);
  }

  return stocks;
};

const getCarts = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching all carts for user:",
    options.userName
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.cart where idUser = ? AND status < ?",
      [options.userId, SConst.CART.STATUS.COMPLETED]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "fetched all carts for a user."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getStocksForCartId = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching stock details for cartId:",
    options.idcart
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute("SELECT * FROM store.cart_stock where idcart = ?", [
      options.idcart,
    ]);
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "stocks for a cart with id."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getStockDetailsForId = async (options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching stock details for stockID:",
    options.idStock
  );
  let result;
  try {
    const [
      rows,
      fields,
    ] = await db.execute("SELECT * FROM store.stock where idstock = ?", [
      options.idStock,
    ]);
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "stock details for a stock id fetched."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getProductsForStockId = async (options, stock, limit) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "fetching products/items for a stockID:",
    stock.idstock
  );
  let result;
  try {
    //next one is failing
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.product where idstock = ? AND idcmp = ? AND status = ? AND isActive = 1 ORDER BY createdOn ASC LIMIT ? OFFSET 0",
      [
        stock.idstock,
        stock.details.idcmp,
        SConst.PRODUCT.STATUS.AVAILABLE,
        limit,
      ]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "products fetched for a stock."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getAvailableProductsForComponentId = async (options, limit) => {
  logger.debug(
    {
      id: options.reqId,
      ComponentID: options.ComponentID
    },
    "Fetching available products..."
  );
  let result;
  try {
    //next one is failing
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.product where idcmp = ? AND status = ? AND isActive = 1 ORDER BY createdOn ASC LIMIT ? OFFSET 0",
      [
        options.ComponentID,
        SConst.PRODUCT.STATUS.AVAILABLE,
        limit,
      ]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        ComponentID: options.ComponentID
      },
      "Fetched available products."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const getOrderedProductsForComponentId = async (options, limit) => {
  logger.debug(
    {
      id: options.reqId,
      ComponentID: options.ComponentID
    },
    "Fetching ordered products..."
  );
  let result;
  try {
    //next one is failing
    const [
      rows,
      fields,
    ] = await db.execute(
      "SELECT * FROM store.product where idcmp = ? AND status = ? AND isActive = 1 ORDER BY createdOn ASC LIMIT ? OFFSET 0",
      [
        options.ComponentID,
        SConst.PRODUCT.STATUS.ORDERED,
        limit,
      ]
    );
    result = rows;
    logger.debug(
      {
        id: options.reqId,
        ComponentID: options.ComponentID
      },
      "Fetched ordered products."
    );
  } catch (e) {
    // TODO return custom errors.
    logger.error(e);
    result = e;
  } finally {
    return result;
  }
};

const markCartToStockInActiveTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "deleting products for cartId: ",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.cart_stock SET isActive = 0 where idcart = ? ",
      [options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart emptyed."
    );
    return result;
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  }
};

const updateCartToStockWithShipmentDetails = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "updating cart to stock for cartId: ",
    options.cartId
  );

  const shipped = options.availablequantity;
  const pendingQuantity = options.availablequantity - options.requiredQuantity;
  const isPartialShipment = pendingQuantity < 0;
  const isActive = isPartialShipment ? 1 : 0; // if not partial that means we are done with this.

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.cart_stock SET idstock = ?, quantity = ?, shippedQuantity = ?,  isActive = ? where idcart = ? ",
      [options.stock.idstock, Math.abs(pendingQuantity), shipped, isActive,  options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart to stock updated."
    );
    return result;
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  }
};

const markCartInActiveTx = async (connection, options, isPartialShipment) => {
  const status = isPartialShipment ? SConst.CART.STATUS.PARTIAL_COMPLETED : SConst.CART.STATUS.COMPLETED;

  logger.debug(
    {
      id: options.reqId,
      status: status
    },
    "Making cart completed or partial for cartId: ",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.cart SET isActive = 0, status = ? where idcart = ? ",
      [status, options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart to stock updated."
    );
  } catch (e) {
    // TODO return error
    logger.error(e);
    throw e;
  }
};

// ====================

module.exports = {
  getAll,
  getAllWithDetails,
  getById,
  create,
  modifyStatus,
  deleteAll,
  deleteOne,
  addProductsToCart,
  addProductToCart,
  modifyProductForCart,
  checkoutACart,
  deleteAProduct,
  deleteProductsAfterSyncWithPTE
};
