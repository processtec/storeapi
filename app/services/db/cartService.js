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
const leylaService = require("./leylaService");
const ocService = require("../search/ocSearchService");

const getById = async (options) => {
  const cart = await getCartById(options);
  if (cart.length < 1) {
    return {};
  }

  const stocks = await getDetailedStocksForACart({
    idcart: cart[0].idcart,
  });

  cart[0].stocks = stocks;
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
    let detailedMessage = "";
    const orderConfirmaion = await ocService.ocById({
      reqID: options.reqId,
      ocID: options.ocId,
    });

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];
      const availablequantity = stock.details.availablequantity; // avaialble quantity for that product in stock table

      const limit = stock.quantity; // quantity asked by user in cart
      const products = await getProductsForStockId(options, stock, limit);
      // 3. If quantity asked for any of the product in cart is less than available in stocks table discard the transaction with reason.
      if (products.length < stock.quantity) {
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
    }

    // 7. mark cart as completed
    await markCartToStockInActiveTx(connection, options);
    await markCartInActiveTx(connection, options);

    // 8. TODO send an event for alert. Do we need to send it now or after the func returns and with some low level priority queue?.
    // await createAlertTx(connection, options);
    const message = `${options.userName} checked out a cart with id: ${cart.idcart}`;
    alertService.create({
      type: SConst.ALERT.TYPE.CHECKOUT_SUCCESS,
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

/**
Private
*/

const updateStockForCartCheckout = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "updating stock for cart checkout."
  );
  const newQuantity = options.availablequantity - options.quantity;
  const availablequantity = newQuantity < 0 ? 0 : newQuantity;

  // const maximumquantity = options.stock.maximumquantity < availablequantity; // TODO send an alert. Do I need a new alert table?

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE stock SET availablequantity = ?, lastModifiedBy = ? where idstock = ?",
      [availablequantity, options.idUser, options.idstock]
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
      "SELECT * FROM store.cart where idUser = ? AND idcart = ? AND status = ? LIMIT 0, 1",
      [options.userId, options.cartId, SConst.CART.STATUS.AVAILABLE]
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
      "SELECT * FROM store.cart where idUser = ? AND status = ?",
      [options.userId, SConst.CART.STATUS.AVAILABLE]
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

const markCartInActiveTx = async (connection, options) => {
  logger.debug(
    {
      id: options.reqId,
    },
    "Making cart inactive for cartId: ",
    options.cartId
  );

  let result;
  try {
    const [
      rows,
      fields,
    ] = await connection.query(
      "UPDATE store.cart SET isActive = 0, status = ? where idcart = ? ",
      [SConst.CART.STATUS.COMPLETED, options.cartId]
    );
    result = rows;
    logger.info(
      {
        id: options.reqId,
        result: result,
      },
      "cart marked inactive."
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
  addProductToCart,
  modifyProductForCart,
  checkoutACart,
  deleteAProduct,
};
