'use strict';
const router = require('express')();
const tracksManager = require('../../managers/Tracks.js');
const base = require('../../middlewares/Base');
const warblsConfig = require('../../config/Warbls.config');

router.get('/', (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  tracksManager
    .getTracksInfo(reqObj)
    .then((data) => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

router.delete('/', (req, res, next) => {
  const { tracks } = req.headers;

  return tracksManager
    .deleteTracks(tracks)
    .then(function (data) {
      res.status(200).json(data);
    })
    .catch(function (err) {
      next(err);
    });
});

router.put(
  '/:track_id',
  (req, res, next) => {
    base.validateRequest(req, res, next, ['log']);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    tracksManager
      .updateTracksInfo(reqObj, req.params.track_id)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.post(
  '/',
  (req, res, next) => {
    base.validateListRequest(req, res, next, [
      'track_name',
      'track_url',
      'added_by',
    ]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    tracksManager
      .addTracksInfo(reqObj)
      .then((data) => {
        if (data != '') res.status(200).json(data);
        else res.status(204).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

router.get('/my-track/:user_id', (req, res, next) => {
  const user_id = req.params.user_id;

  return tracksManager
    .getPersonalTrackInfo(user_id)
    .then((data) => {
      if (data != [])
        res.status(200).json({
          withdrawAmountThreshold: warblsConfig.WITHDRAW_AMOUNT_THRESHOLD,
          amount: data[1],
          tracks: data[0],
        });
      else res.status(204).json(data);
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/getTracksGenre", (req, res, next) => {
  tracksManager
    .getTracksGenre()
    .then((data) => {
      if (data.length > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

module.exports = router;
