"use strict";
const router = require("express")();
const promoCodesManager = require("../../managers/PromoCodes.js");
const base = require("../../middlewares/Base");

router.get(
    "/", 
    (req, res, next) => {
        const reqObj = Object.assign({}, req._request);
        promoCodesManager
            .getPromoCodes(reqObj)
            .then(data => {
                if (data.total > 0) res.status(200).json(data);
                else res.status(204).send();
            })
            .catch(function(err) {
                next(err);
            });
    }
);

router.put(
    "/:code_id",
    (req, res, next) => {
        base.validateRequest(req, res, next, ["log"]);
    },
    (req, res, next) => {
        const reqObj = Object.assign({}, req._request);
        promoCodesManager
            .updatePromoCode(reqObj, req.params.code_id)
            .then(function(data) {
                res.status(200).json(data);
            })
            .catch(function(err) {
                next(err);
            });
    }
);

router.post(
    "/",
    (req, res, next) => {
        base.validateRequest(req, res, next, ["code", "expire_at"]);
    },
    (req, res, next) => {
        const reqObj = Object.assign({}, req._request);
        promoCodesManager
            .addPromoCode(reqObj)
            .then(data => {
                res.status(200).json(data);
            })
            .catch(err => {
                next(err);
            });
    }
);

module.exports = router;