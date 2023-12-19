"use strict";
require("dotenv").config({ path: require("app-root-path") + "/.env" });
const models = require("../models")["Warbls"];
const helpers = require("../modules/helpers");
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const config = require("../config/" + process.env.PROJECT + ".config.js");
const usersManager = require("../managers/Users");
const ordersManager = require("../managers/Orders");
const transactionsManager = require("../managers/Transactions");
const trackStatsManager = require("../managers/TrackStats");
const paypal = require("@paypal/checkout-server-sdk");
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);
class Payments {
  static async getOrCreateStripeConnectedAccount(reqObj) {
    return await models.Users.query()
      .where("user_id", reqObj.user_id)
      .first()
      .debug()
      .then(async (data) => {
        let connectedAccountDetails = {};
        if (data.st_ca_id != null && data.st_ca_id != "") {
          await stripe.account
            .retrieve(data.st_ca_id)
            .then((caData) => {
              connectedAccountDetails = caData;
            })
            .catch((err) => {
              throw new Error(err);
            });
        } else {
          await stripe.accounts
            .create({
              email: data.email,
              type: "express",
              business_profile: {
                name: data.full_name,
              },
              metadata: {
                warblsUserId: data.user_id,
              },
            })
            .then(async (connectedAccountData) => {
              if (
                connectedAccountData != undefined &&
                connectedAccountData != ""
              ) {
                const updateUserReq = {
                  st_ca_id: connectedAccountData.id,
                  log: '{"log_added_by":"-1"}',
                };
                await usersManager.updateUser(updateUserReq, data.user_id);
              }
              connectedAccountDetails = connectedAccountData;
            })
            .catch((err) => {
              console.log(err);
            });
        }
        return connectedAccountDetails;
      });
  }
  static async generateOnboardingLink(reqObj) {
    const connectedAccountDetails =
      await this.getOrCreateStripeConnectedAccount(reqObj);
    const r = await stripe.accountLinks.create({
      account: connectedAccountDetails.id,
      refresh_url: config.UI_BASE_URL,
      return_url: config.UI_BASE_URL,
      type: "account_onboarding",
    });
    return r.url;
  }
  static async stripePayment(reqObj) {
    const tracks = await getTracks(reqObj);

    return await models.Users.query()
      .where("user_id", reqObj.user_id)
      .first()
      .debug()
      .then(async (data) => {
        let customer = {};
        if (data.st_cust_id) {
          await stripe.customers
            .retrieve(data.st_cust_id)
            .then((custData) => {
              customer = custData;
            })
            .catch((err) => {
              throw new Error(err);
            });
        } else {
          await stripe.customers
            .create({
              email: data.email,
              name: data.full_name,
              address: {
                country: reqObj.country,
                postal_code: reqObj.postal_code,
              },
            })
            .then(async (custData) => {
              customer = custData;
              const updateUserReq = {
                st_cust_id: customer.id,
                log: '{"log_added_by":"-1"}',
                token_id: token.id,
              };
              await usersManager.updateUser(updateUserReq, reqObj.user_id);
            })
            .catch((err) => {
              console.log(err);
            });
        }

        if (!reqObj.useExisitingCard) {
          const token = await stripe.tokens.create({
            card: {
              number: reqObj.number,
              exp_month: reqObj.month,
              exp_year: reqObj.year,
              cvc: reqObj.cvc,
              name: reqObj.name,
            },
          });
          await stripe.customers.update(customer.id, { source: token.id });
          const updateUserReq = {
            log: '{"log_added_by":"-1"}',
            st_cust_id: customer.id,
            token_id: token.id,
          };
          await usersManager.updateUser(updateUserReq, reqObj.user_id);
        }
        return customer;
      })
      .then(async (customer) => {
        let amount = tracks.reduce((acc, { is_oneshot, is_phrases }) => {
          return (
            acc + (!!is_oneshot ? config.ONESHOT_AMOUNT : config.PHRASE_AMOUNT)
          );
        }, 0);
        amount = amount.toFixed(2) * 100;
        return await stripe.charges.create({
          amount: parseInt(amount),
          description: "purchasing songs",
          currency: "USD",
          customer: customer.id,
          metadata: {
            user_id: reqObj.user_id,
          },
        });
      })
      .then(async (charge) => {
        if (charge != "") {
          const invoiceDetails = {
            invoice_url: charge.receipt_url,
            invoice_meta: "'" + JSON.stringify(charge) + "'",
          };

          let orderDetailsMeta = [];
          if ("track_ids" in reqObj) {
            for (let i = 0; i < reqObj.track_ids.length; i++) {
              let t = tracks.find((x) => x.track_id == reqObj.track_ids[i]);
              let singleOrderData = {
                track_id: reqObj.track_ids[i],
                amount: !!t.is_oneshot
                  ? config.ONESHOT_AMOUNT
                  : config.PHRASE_AMOUNT,
              };

              orderDetailsMeta.push(singleOrderData);
            }
          }

          const orderData = createOrderData(
            orderDetailsMeta,
            reqObj,
            invoiceDetails
          );

          return await ordersManager
            .addOrder(orderData)
            .then(async (responseData) => {
              const transactionsData = await createTransactionsData(
                reqObj,
                tracks,
                responseData
              );

              return await transactionsManager
                .addTransactions(transactionsData)
                .then(async (respData) => {
                  return await recordTrackStatsDownload(reqObj);
                })
                .catch((err) => {
                  throw new Error(err);
                });
            })
            .catch((err) => {
              throw new Error(err);
            });
        }
      })
      .catch(function (err) {
        throw new Error(err);
      });
  }
  static async paypalCreateOrder(reqObj) {
    const tracks = await getTracks(reqObj);
    const amount = calculateAmount(tracks);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: parseInt(amount),
          },
        },
      ],
    });

    try {
      const response = await client.execute(request);
      const orderID = response.result.id;

      return { orderID };
    } catch (err) {
      throw new Error(err);
    }
  }
  static async paypalCaptureOrder(reqObj) {
    const tracks = await getTracks(reqObj);
    const request_capture_order = new paypal.orders.OrdersCaptureRequest(
      reqObj.orderID
    );
    request_capture_order.requestBody({});

    try {
      await client.execute(request_capture_order);

      const request = new paypal.orders.OrdersGetRequest(reqObj.orderID);

      const response = await client.execute(request);
      const order = response.result;

      const orderDetailsMeta = createOrderDetailsMeta(order, tracks, reqObj);
      const orderData = createOrderData(orderDetailsMeta, reqObj);

      return await ordersManager
        .addOrder(orderData)
        .then(async (responseData) => {
          const transactionsData = await createTransactionsData(
            reqObj,
            tracks,
            responseData
          );

          return await transactionsManager
            .addTransactions(transactionsData)
            .then(async (respData) => {
              return await recordTrackStatsDownload(reqObj);
            })
            .catch((err) => {
              throw new Error(err);
            });
        })
        .catch((err) => {
          throw new Error(err);
        });
    } catch (error) {
      console.error("Error capturing payment:", error);
    }
  }
  static async createTransfer(reqObj) {
    return await models.Users.query()
      .where("user_id", reqObj.user_id)
      .first()
      .debug()
      .then(async (data) => {
        let transfer = {};
        if (!!!data.st_ca_id) {
          await this.getOrCreateStripeConnectedAccount(reqObj);
        }
        transfer = await stripe.transfers.create({
          amount: reqObj.amount * 100.0, // by default stripe assumes amount in cents, thats why making it in dollars
          currency: "usd", // TODO: Verify currency ir nok or usd
          destination: data.st_ca_id,
        });
        var res = null;
        if (transfer.id) {
          res = await models.Transactions.query().insert({
            type: "withdraw",
            amount: reqObj.amount,
            currency: "usd", // TODO: Verify currency ir nok or usd
            user_id: reqObj.user_id,
          });
        }
        return res;
      })
      .catch((err) => {
        console.log(err);
        return "";
      });
  }
  static async getCardInfo(decodedResponse) {
    const currentUserId = decodedResponse.decoded.adminId;
    try {
      const data = await models.Users.query()
        .select()
        .where("user_id", currentUserId)
        .first();
      const token = await stripe.tokens.retrieve(data.token_id);
      return token.card;
    } catch (err) {
      return "";
    }
  }
}

async function getTracks(reqObj) {
  const tracks = [];
  if ("track_ids" in reqObj) {
    for (let i = 0; i < reqObj.track_ids.length || 0; i++) {
      const t = await models.Tracks.query()
        .where("track_id", reqObj.track_ids[i])
        .first();
      tracks.push(t);
    }
  }
  return tracks;
}

function calculateAmount(tracks) {
  return tracks
    .reduce((acc, { is_oneshot, is_phrases }) => {
      return (
        acc + (!!is_oneshot ? config.ONESHOT_AMOUNT : config.PHRASE_AMOUNT)
      );
    }, 0)
    .toFixed(2);
}

function createOrderDetailsMeta(order, tracks, reqObj) {
  const orderDetailsMeta = [];
  if ("track_ids" in reqObj) {
    for (let i = 0; i < reqObj.track_ids.length; i++) {
      let t = tracks.find((x) => x.track_id == reqObj.track_ids[i]);
      let singleOrderData = {
        track_id: reqObj.track_ids[i],
        amount: !!t.is_oneshot ? config.ONESHOT_AMOUNT : config.PHRASE_AMOUNT,
        payment_method: "paypal",
        source: "paypal",
        paypal_ord_id: order.id,
      };

      orderDetailsMeta.push(singleOrderData);
    }
  }
  return orderDetailsMeta;
}

function createOrderData(orderDetailsMeta, reqObj, invoiceDetails = {}) {
  const orderData = {
    user_id: reqObj.user_id,
    order_status: "confirmed",
    order_details: orderDetailsMeta,
    invoice: invoiceDetails,
  };
  return orderData;
}

async function createTransactionsData(reqObj, tracks, responseData) {
  const transactionsData = [];
  for (let j = 0; j < reqObj.track_ids.length; j++) {
    let tracksMeta = await models.Tracks.query()
      .where("track_id", reqObj.track_ids[j])
      .first()
      .debug()
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw new Error(err);
      });

    let artistAmount = 0;
    let adminAmount = 0;

    if (tracksMeta.is_phrases == 1) {
      artistAmount = config.ARTIST_PHARASE_AMOUNT;
      adminAmount = config.PHRASE_AMOUNT - config.ARTIST_PHARASE_AMOUNT;
    } else if (tracksMeta.is_oneshot == 1) {
      artistAmount = config.ARTIST_ONE_SHOT_AMOUNT;
      adminAmount = config.ONESHOT_AMOUNT - config.ARTIST_ONE_SHOT_AMOUNT;
    }

    var order_details_id;
    responseData.order_details.map((details) => {
      if (reqObj.track_ids[j] === details.track_id) {
        order_details_id = details.order_details_id;
      }
    });

    let singleTransactionForArtist = {
      type: "deposit",
      amount: artistAmount,
      user_id: tracksMeta.added_by,
      order_details_id: order_details_id,
    };

    transactionsData.push(singleTransactionForArtist);

    let singleTransactionForAdmin = {
      type: "deposit",
      amount: adminAmount,
      user_id: "-1",
      order_details_id: order_details_id,
    };

    transactionsData.push(singleTransactionForAdmin);
  }
  return transactionsData;
}

async function recordTrackStatsDownload(reqObj) {
  if ("track_ids" in reqObj) {
    let trackStatsDownload = [];
    for (let i = 0; i < reqObj.track_ids.length; i++) {
      let singleStat = {
        object_type: "user",
        object_id: reqObj.user_id,
        action_against_id: reqObj.track_ids[i],
        action: "download",
      };

      trackStatsDownload.push(singleStat);
    }

    return await trackStatsManager
      .recordStatsTrackWise(trackStatsDownload)
      .then((data) => {
        return data;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}

module.exports = Payments;
