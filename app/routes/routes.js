#!/usr/bin/env node

/*jslint node: true */
"use strict";

/** controllers goes here */
const stock = require('../useCases/stock/controller/stockController');
const warehouse = require('../useCases/warehouse/controller/warehouseController');
const component = require('../useCases/components/componentsController');
const po = require('../useCases/po/poController');
const oc = require('../useCases/oc/ocController');
const session = require('../useCases/session/sessionController');
const cart = require('../useCases/cart/cartController');
const location = require('../useCases/location/locationController');
const report = require('../useCases/cart/cartController');

const register = (options) => {
  const { router } = options;

  /**
   * NO JWT ROUTES
   */
  // session doesn't requires JWT
  router.post('/session', session.create);

  /**
   * JWT ROUTES
   */
  // Tokens
  router.post('/token', session.refresh); // returns a new JWT from refresh token provided.
  router.get('/token', session.validate); // TODO do we need this?
  router.delete('/token', session.destroy); // delete refresh token

  /** ############# SEARCH  ############# */

  // components search
  router.get('/component/search', component.getComponents);
  router.get('/component/:id', component.getComponent);

  // OC search
  router.get('/oc/search', oc.searchOC);
  router.get('/oc/:id', oc.getOC);

  // PO search
  router.get('/po/search', po.searchPO);
  router.get('/po/:id', po.getPO);

  /** #############  DB  ############# */

  // stock & product
  router.get('/stock/component/:stockId/:cmpId', stock.getProductsByComponentAndStock);
  router.get('/stock/component/:id', stock.getStockByComponent);
  router.get('/stock/:id', stock.getStock);
  router.post('/stock', stock.addProduct); // TODO move it out
  router.put('/stock', stock.sellProduct);
  

  // router.put('/product', product.modify); to change status of a specific product

  // CART
  router.get('/cart/all', cart.getCarts);
  router.get('/cart/alldetails', cart.getCartsWithDetails);
  router.get('/cart/:id', cart.getCart);

  router.post('/cart', cart.createCart);
  router.post('/cart/:id/product', cart.addProduct);

  router.put('/cart/:id', cart.modifyCart);
  router.put('/cart/:id/product', cart.modifyProduct);
  router.put('/cart/:id/checkout', cart.checkout);

  router.delete('/cart/all', cart.deleteCarts);
  router.delete('/cart/:id', cart.deleteCart);
  router.delete('/cart/:id/product', cart.deleteProduct);

  // warehouse or better be locations only as they will be used more than creating a new warehouse
  router.get('/warehouse', warehouse.getWarehouses);

//   LOCATION
  router.get('/location/search', location.searchLocation);
  router.get('/location/all', location.getLocations);
  router.get('/location/:id', location.getLocation);
  router.post('/location', location.createLocation);
  router.put('/location/:id', location.modifyLocation);
  router.delete('/location/:id', location.deleteLocation);

  // transaction


  // REPORTS
  router.get('/report/cart/all', report.getAllCartsReport);
  router.get('/report/cart/:id', report.getCartShipmentsReport);
  router.get('/report/cart/shipment/:id', report.getCartShipmentReportDetails);
};

module.exports = {
    register
};
