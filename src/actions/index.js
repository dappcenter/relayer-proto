const getOrders = require('./get-orders');
const cancelOrder = require('./cancel-order');
const completeOrder = require('./complete-order');
const fillOrder = require('./fill-order');
const placeOrder = require('./place-order');

// TODO: Use this in the ACTIONS array
const ACTION_TYPES = {
  PLACE_ORDER: 'request:placeOrder',
  CANCEL_ORDER: 'request:cancelOrder',
  COMPLETE_ORDER: 'request:completeOrder',
  FILL_ORDER: 'request:fillOrder',
};

const ACTIONS = [
  // Maker actions
  { name: 'request:placeOrder', fn: placeOrder },
  { name: 'request:cancelOrder', fn: cancelOrder },
  { name: 'request:completeOrder', fn: completeOrder },

  // Taker actions
  { name: 'request:fillOrder', fn: fillOrder },
];

module.exports = {
  actions: ACTIONS,
  actionTypes: ACTION_TYPES,
  getOrders,
};
