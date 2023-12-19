'use strict';
const router = require('express')();
const artistFormsManager = require('../../managers/ArtistForms.js');
const base = require('../../middlewares/Base');

router.get('/', (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  artistFormsManager
    .getArtistForms(reqObj)
    .then((data) => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

router.put(
  '/:form_id',
  (req, res, next) => {
    base.validateRequest(req, res, next, ['log']);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    artistFormsManager
      .updateArtistForm(reqObj, req.params.form_id)
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
    base.validateRequest(req, res, next, [
      'user_id',
      'previous_work',
      'sm_link',
      'genre',
    ]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    artistFormsManager
      .addArtistForms(reqObj)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

module.exports = router;
