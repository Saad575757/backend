'use strict';
const router = require('express')();
const trackStatsManager = require('../../managers/TrackStats.js');
const base = require('../../middlewares/Base');

router.get(
  '/track-wise',
  (req, res, next) => {
    // base.validateRequest(req, res, next, ["action_against_id"]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .getTrackWiseStats(reqObj)
      .then((data) => {
        if (data.total > 0) res.status(200).json(data);
        else res.status(204).send();
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.post(
  '/track-wise',
  (req, res, next) => {
    base.validateListRequest(req, res, next, [
      'object_type',
      'object_id',
      'action',
      'action_against_id',
    ]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .recordStatsTrackWise(reqObj)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

router.put(
  '/track-wise/:action_against_id',
  (req, res, next) => {
    base.validateRequest(req, res, next, ['log', 'object_id', 'action']);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .updateStatsTrackWise(req.params.action_against_id, reqObj)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.get(
  '/popular-artists',

  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .popularArtist(reqObj)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.get(
  '/trending-tracks',

  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .trendingTracks(reqObj)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.get(
  '/popular-tracks',

  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    trackStatsManager
      .popularTracks(reqObj)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

module.exports = router;
