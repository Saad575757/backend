"use strict";
const router = require("express")();
const transactionsManager = require("../../managers/Transactions");
const base = require("../../middlewares/Base");

router.get("/", (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  transactionsManager
    .getTransactionsInfo(reqObj)
    .then(data => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function(err) {
      next(err);
    });
});


router.post(
    "/",
    (req, res, next) => {
        base.validateRequest(req, res, next, ["user_id"]);
    },
    (req, res, next) => {
        const reqObj = Object.assign({}, req._request);
        transactionsManager
            .addOrder(reqObj)
            .then(data => {
                res.status(200).json(data);
            })
            .catch(err => {
                next(err);
            });
    }
);


module.exports = router;