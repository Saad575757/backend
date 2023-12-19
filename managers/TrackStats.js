'use strict';
const models = require('../models')['Warbls'];
const helpers = require('../modules/helpers');
const objection = require('objection');
const knex = require('../models/Warbls/index')['knex'];
const dbconfig = require('../config/dbconfig');
const { knexSnakeCaseMappers } = require('objection');

const camelToSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
class TrackStats {
  static getTrackWiseStats(data) {
    const reqData = Object.assign({}, data);
    delete reqData.action_against_id;

    const knexObj = helpers.list(models.TrackStats, reqData);

    knexObj.select(
      dbconfig.dbTrackStats + '.action_against_id as track_id',
      dbconfig.dbTrackStats + '.action'
    );

    knexObj.count(dbconfig.dbTrackStats + '.ts_id AS counts');

    try {
      if (
        'action_against_id' in data &&
        data.action_against_id.constructor != Array &&
        data.action_against_id.constructor != Number
      )
        knexObj.whereIn(
          dbconfig.dbTrackStats + '.action_against_id',
          JSON.parse(data.action_against_id)
        );
      else
        knexObj.where(
          dbconfig.dbTrackStats + '.action_against_id',
          '=',
          data.action_against_id
        );
    } catch (err) {
      knexObj.where(
        dbconfig.dbTrackStats + '.action_against_id',
        '=',
        data.action_against_id
      );
    }

    knexObj.where(dbconfig.dbTrackStats + '.status', 1);

    knexObj.groupBy(
      dbconfig.dbTrackStats + '.action_against_id',
      dbconfig.dbTrackStats + '.action'
    );

    knexObj.debug();
    return knexObj;
  }

  static recordStatsTrackWise(data) {
    return objection.transaction(knex, async (trx) => {
      const tracksStatsData = [];

      for (let i = 0; i < Object.keys(data).length; i++) {
        const tracksStatsTemp = await helpers.buildModel(
          models.TrackStats,
          data[i]
        );
        tracksStatsData.push(tracksStatsTemp);
      }

      return models.TrackStats.query(trx)
        .insertGraph(tracksStatsData)
        .debug()
        .then((user) => {
          return user;
        });
    });
  }

  static popularArtist() {
    const subquery = knex('wb_track_stats')
      .select('wb_tracks.added_by')
      .from('wb_track_stats')
      .innerJoin('wb_tracks', 'action_against_id', '=', 'wb_tracks.track_id')
      .groupBy('wb_tracks.added_by')
      .orderBy(knex.raw('COUNT(ts_id)'), 'desc')
      .where({
        action: 'download',
      });

    return objection.transaction(knex, (trx) => {
      return models.Users.query(trx)
        .select('*')
        .where('user_id', 'in', subquery)
        .debug()
        .then((tracks) => {
          return tracks;
        });
    });
  }

  static trendingTracks() {
    const subquery = knex('wb_track_stats')
      .select('wb_track_stats.action_against_id')
      .from('wb_track_stats')
      .innerJoin('wb_tracks', 'action_against_id', '=', 'wb_tracks.track_id')
      .groupBy('wb_track_stats.action_against_id')
      .where('wb_tracks.date_added', '>', knex.raw('now() - interval 168 hour'))
      .andWhere('action', 'download');

    return objection.transaction(knex, (trx) => {
      return models.Tracks.query(trx)
        .select('*')
        .where('track_id', 'in', subquery)
        .andWhere({
          status: 'active',
        })
        .debug()
        .then((tracks) => {
          return tracks;
        });
    });
  }

  static popularTracks() {
    const subquery = knex('wb_track_stats')
      .select('wb_track_stats.action_against_id')
      .from('wb_track_stats')
      .innerJoin('wb_tracks', 'action_against_id', '=', 'wb_tracks.track_id')
      .groupBy('wb_track_stats.action_against_id')
      .where(
        'wb_tracks.date_added',
        '>',
        knex.raw('now() - interval 1440 hour')
      )
      .andWhere('action', 'download');

    return objection.transaction(knex, (trx) => {
      return models.Tracks.query(trx)
        .select('*')
        .where('track_id', 'in', subquery)
        .andWhere({
          status: 'active',
        })
        .debug()
        .then((tracks) => {
          return tracks;
        });
    });
  }

  static updateStatsTrackWise(actionAgainstId, reqObj) {
    reqObj.object_type = 'user';
    return objection.transaction(knex, (trx) => {
      return models.TrackStats.query(trx)
        .where('action_against_id', actionAgainstId)
        .where('object_type', 'user')
        .where('object_id', reqObj.object_id)
        .where('action', reqObj.action)
        .delete()
        .context({ reqObj: reqObj, action_against_id: actionAgainstId })
        .debug()
        .then((updatedTrack) => {
          return updatedTrack;
        });
    });
  }
}

module.exports = TrackStats;
