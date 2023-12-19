"use strict";
const config = require("../config/" + process.env.PROJECT + ".config.js");
const dbPrefix = config.DB_PREFIX || "wb_";
const dbName = process.env.DB_NAME + ".";
module.exports = {
  dbSmcApiLog: dbName + dbPrefix + "smc_api_log",
  dbUserActivities: dbName + dbPrefix + "user_activities",
  dbAccessToken: dbName + dbPrefix + "api_oauth_access_tokens",
  dbAuthorizationCode: dbName + dbPrefix + "api_oauth_authorization_codes",
  dbClient: dbName + dbPrefix + "api_oauth_clients",
  dbRefreshToken: dbName + dbPrefix + "api_oauth_refresh_tokens",
  dbApiRequestCache: dbName + dbPrefix + "api_request_cache",
  dbAdminActivityLogCp: dbName + dbPrefix + "admin_activity_log_cp",
  dbUsers: dbName + dbPrefix + "users",
  dbUsersLog: dbName + dbPrefix + "users_log",
  dbUserTypes: dbName + dbPrefix + "user_types",
  dbUserReports: dbName + dbPrefix + "user_reports",
  dbUserReportsLog: dbName + dbPrefix + "user_reports_log",
  dbArtistForm: dbName + dbPrefix + "artist_form",
  dbArtistFormLog: dbName + dbPrefix + "artist_form_log",
  dbPromoCodes: dbName + dbPrefix + "promo_codes",
  dbPromoCodesLog: dbName + dbPrefix + "promo_codes_log",
  dbTracks: dbName + dbPrefix + "tracks",
  dbTracksLog: dbName + dbPrefix + "tracks_log",
  dbTracksFeedBack: dbName + dbPrefix + "tracks_feed_back",
  dbTracksFeedBackLog: dbName + dbPrefix + "tracks_feed_back_log",
  dbTrackStats: dbName + dbPrefix + "track_stats",
  dbTrackStatsLog: dbName + dbPrefix + "track_stats_log",
  dbOrders: dbName + dbPrefix + "orders",
  dbOrderDetails: dbName + dbPrefix + "order_details",
  dbInvoice: dbName + dbPrefix + "invoice",
  dbTransactions: dbName + dbPrefix + "transactions",
  dbTransactionsLog: dbName + dbPrefix + "transactions_log",
};
