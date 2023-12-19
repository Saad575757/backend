"use strict";
const models = require("../models")["Warbls"];
const helpers = require("../modules/helpers");
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];

class Orders {
    static getOrdersInfo(reqData) {
      
      const knexObj = helpers.list(models.Orders, reqData);

      if ("load" in reqData) {
          if (reqData.load.indexOf("order_details.track_details") > -1) {
            knexObj.eager("[user_details,order_details.track_details]");
          }
      }
      
      return knexObj
            .debug()
            .then(data => {
              return data;
            });
    }

    static addOrder(reqData){

        const ordersData = reqData;

        return objection.transaction(knex, trx => {
          return models.Orders.query(trx)
            .insertGraph(ordersData)
            .debug()
            .then(record => {
              return record;
            });
        });
    }
}

module.exports = Orders;