'use strict';
const models = require('../models')['Warbls'];
const helpers = require('../modules/helpers');
const objection = require('objection');
const knex = require('../models/Warbls/index')['knex'];
const dbconfig = require('../config/dbconfig');
const config = require('../config/' + process.env.PROJECT + '.config');

const camelToSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
class Tracks {
  static getTracksInfo(reqData) {
    let request = Object.assign({}, reqData);
    request = helpers.omit(request, ['track_name']);
    const knexObj = helpers.list(models.Tracks, request);

    knexObj.select(dbconfig.dbTracks + '.*');

    if ('track_name' in reqData) {
      knexObj.where(
        knex.raw(
          "LOWER(track_name) like '%" + reqData.track_name.toLowerCase() + "%'"
        )
      );
    }

    if (request.searchFilters) {
      const userFilters = JSON.parse(request.searchFilters);
      let query = '';
      for (var [key, value] of Object.entries(userFilters)) {
        if (!value || value === '') continue;
        key = camelToSnakeCase(key);
        if (key === 'key') value.replace(/[^a-zA-Z ]/g, '');
        if (key === 'search_key') {
          if (query !== '') query += ' AND ';
          query += `LOWER(track_name) LIKE '%${userFilters.searchKey
            .toLowerCase()
            .replace(/ /g, '_')}%'
            `;
        } else {
          if (value === '0') continue;
          if (query !== '') query += ' AND ';
          if (key === 'genre') query += `${key} = "${value}"`;
          else if (key === "bpm")
            query += `(${key} BETWEEN ${value.join(
              " AND "
            )}) OR ${key} IN (${value.join(", ")})`;
          else if (key === 'key') query += `${'`key`'} = '${value}'`;
          else if (
            key === 'trending' &&
            value === 'Random' &&
            !('action' in request)
          ) {
            query += `status = 'active'`;
          } else if (key === 'trending' && value === 'Popular') {
            const subquery = knex('wb_track_stats')
              .select('wb_track_stats.action_against_id')
              .from('wb_track_stats')
              .innerJoin(
                'wb_tracks',
                'action_against_id',
                '=',
                'wb_tracks.track_id'
              )
              .groupBy('wb_track_stats.action_against_id')
              .where(
                'wb_tracks.date_added',
                '>',
                knex.raw('now() - interval 1440 hour')
              )
              .andWhere('action', 'download');

            query += `status = active AND track_id in ${subquery}`;
          } else if (key === 'trending' && value === 'Trending') {
            const subquery = knex('wb_track_stats')
              .select('wb_track_stats.action_against_id')
              .from('wb_track_stats')
              .innerJoin(
                'wb_tracks',
                'action_against_id',
                '=',
                'wb_tracks.track_id'
              )
              .groupBy('wb_track_stats.action_against_id')
              .where(
                'wb_tracks.date_added',
                '>',
                knex.raw('now() - interval 168 hour')
              )
              .andWhere('action', 'download');
            query += `status = active AND track_id in ${subquery}`;
          } else if (
            key === 'trending' &&
            value === 'Standard' &&
            !('action' in request)
          ) {
            query += `status = 'active'`;
          } else if (
            key === 'trending' &&
            value === 'Standard' &&
            'action' in request
          ) {
            query += ``;
          } else query += `${key} = ${value}`;
        }
      }
      if (request.searchFilters.includes('Random') && !('action' in request))
        query += ` ORDER BY RAND()`;
      knexObj.where(knex.raw(query));
    }

    if ('object_type' in reqData && 'object_id' in reqData) {
      knexObj.select(
        knex.raw(
          "SUM(IF(track_stats.`action` = 'like',1,0)) AS liked,SUM(IF(track_stats.`action` = 'download',1,0)) AS download"
        )
      );
      if ('action' in reqData) {
        knexObj.innerJoinRelation('track_stats');
        knexObj.where('object_type', reqData.object_type);
        knexObj.where('object_id', reqData.object_id);
        knexObj.where('action', reqData.action);
      } else {
        knexObj.leftJoin(dbconfig.dbTrackStats + ' AS track_stats', (join) => {
          join.on(
            dbconfig.dbTracks + '.track_id',
            'track_stats.action_against_id'
          );
          join.on(
            'track_stats.object_type',
            '=',
            knex.raw("'" + reqData.object_type + "'")
          );
          join.on(
            'track_stats.object_id',
            '=',
            knex.raw("'" + reqData.object_id + "'")
          );
        });
      }

      knexObj.groupBy(dbconfig.dbTracks + '.track_id');
    }
    return knexObj
      .debug()
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return err;
      });
  }

  static deleteTracks(tracks) {
    return objection.transaction(knex, async (trx) => {
      return await models.Tracks.query(trx)
        .whereIn('track_id', JSON.parse(tracks))
        .del()
        .debug()
        .then((tracksMeta) => {
          return tracksMeta;
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  }

  static updateTracksInfo(reqObj, track_id) {
    if (reqObj.is_phrases) reqObj.price = config.PHRASE_AMOUNT;
    else if (reqObj.is_oneshot) reqObj.price = config.ONESHOT_AMOUNT;
    const updatedData = helpers.buildModel(models.Tracks, reqObj);

    return objection.transaction(knex, async function (trx) {
      return await models.Tracks.query(trx)
        .updateAndFetchById(track_id, updatedData)
        .context({ reqobj: reqObj, track_id: track_id })
        .debug()
        .then((ok) => {
          return ok;
        });
    });
  }

  static addTracksInfo(data) {
    return objection.transaction(knex, async (trx) => {
      const tracks = [];

      for (let i = 0; i < Object.keys(data).length; i++) {
        data[i].is_phrases = !!!data[i].is_oneshot;
        data[i].is_oneshot = !data[i].is_phrases;
        if (data[i].is_phrases == 1) data[i].price = config.PHRASE_AMOUNT;
        else if (data[i].is_oneshot == 1) data[i].price = config.ONESHOT_AMOUNT;

        const tracksTemp = await helpers.buildModel(models.Tracks, data[i]);
        tracks.push(tracksTemp);
      }

      return await models.Tracks.query(trx)
        .insertGraph(tracks)
        .debug()
        .then((tracksMeta) => {
          return tracksMeta;
        })
        .catch((err) => {
          throw new Error(err);
        });
    });
  }

  static getPersonalTrackInfo = (user_id) => {
    const wbTrackIdColumnIdentifier = knex.raw('??', [
      `${dbconfig.dbTracks}.track_id`,
    ]);
    const wbOrderDetailsIdColumnIdentifier = knex.raw('??', [
      `${dbconfig.dbOrderDetails}.order_details_id`,
    ]);

    const downloadSubQuery = models.TrackStats.query()
      .count('action')
      .where({
        'wb_track_stats.action': 'download',
        'wb_track_stats.action_against_id': wbTrackIdColumnIdentifier,
      })
      .as('downloads');

    const likesSubQuery = models.TrackStats.query()
      .count('action')
      .where({
        'wb_track_stats.action': 'like',
        'wb_track_stats.action_against_id': wbTrackIdColumnIdentifier,
      })
      .as('likes');

    const playsSubQuery = models.TrackStats.query()
      .count('action')
      .where({
        'wb_track_stats.action': 'play',
        'wb_track_stats.action_against_id': wbTrackIdColumnIdentifier,
      })
      .as('plays');

    const earningsSubQuery = models.Transactions.query()
      .select(knex.raw('Round(IFNULL(SUM(wb_transactions.amount), 0),2)'))
      .where({
        'wb_transactions.user_id': user_id,
        'wb_transactions.order_details_id': wbOrderDetailsIdColumnIdentifier,
      })
      .join('wb_order_details', 'track_id', wbTrackIdColumnIdentifier)
      .as('earnings');

    const track_data = models.Tracks.query()
      .select(
        'wb_tracks.track_id',
        'wb_tracks.track_name',
        downloadSubQuery,
        likesSubQuery,
        playsSubQuery,
        earningsSubQuery
      )
      .where('wb_tracks.added_by', user_id)
      .groupBy('wb_tracks.track_id')
      .debug();

    const amount_data = models.Transactions.query()
      .select(knex.raw('Round(Sum(amount),2) as amount'), 'type')
      .groupBy('type')
      .where('user_id', user_id);

    return Promise.all([track_data, amount_data]);
  };

  static getTracksGenre() {
    return models.Tracks.query()
      .select(knex.raw("DISTINCT wb_tracks.genre"))
      .whereNotNull("wb_tracks.genre")
      .where(knex.raw("wb_tracks.status = 'active'"))
      .pluck("genre")
      .debug()
      .then((genres) => {
        return genres;
      })
      .catch((err) => {
        return err;
      });
  }
}

module.exports = Tracks;
