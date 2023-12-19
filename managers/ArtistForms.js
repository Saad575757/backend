'use strict';
const models = require('../models')['Warbls'];
const helpers = require('../modules/helpers');
const objection = require('objection');
const knex = require('../models/Warbls/index')['knex'];
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const usersManager = require('../managers/Users');
const paymentsManager = require('../managers/Payments.js');
class ArtistForms {
  static getArtistForms(reqData) {
    let request = Object.assign({}, reqData);
    const knexObj = helpers.list(models.ArtistForms, request);
    return knexObj
      .debug()
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return err;
      });
  }

  static updateArtistForm(reqObj, form_id) {
    const updatedData = helpers.buildModel(models.ArtistForms, reqObj);

    return objection.transaction(knex, async function (trx) {
      return await models.ArtistForms.query()
        .updateAndFetchById(form_id, updatedData)
        .context({ reqobj: reqObj, form_id: form_id })
        .debug()
        .then(async (artistFormRowInDb) => {
          let updateUserReq;
          if (reqObj.status === 'approved') {
            // get user detail by id a.user_id
            await models.Users.query()
              .where('user_id', artistFormRowInDb.user_id)
              .first()
              .debug()
              .then(async (data) => {
                // Create a new stripe connect account
                const stripeConnectedAccount =
                  await paymentsManager.getOrCreateStripeConnectedAccount(data);
                return !!stripeConnectedAccount.id;
              });

            updateUserReq = { user_type: 2, log: '{"log_added_by":"-1"}' };
          } else if (reqObj.status === 'rejected') {
            updateUserReq = { user_type: 0, log: '{"log_added_by":"-1"}' };
          }
          if (updateUserReq) {
            await usersManager.updateUser(
              updateUserReq,
              artistFormRowInDb.user_id
            );
          }
        })
        .then((ok) => {
          return ok;
        });
    });
  }

  static addArtistForms(data) {
    const ArtistFormsData = helpers.buildModel(models.ArtistForms, data);

    return objection.transaction(knex, (trx) => {
      return models.ArtistForms.query(trx)
        .insertGraph(ArtistFormsData)
        .debug()
        .then((user) => {
          return user;
        });
    });
  }
}

module.exports = ArtistForms;
