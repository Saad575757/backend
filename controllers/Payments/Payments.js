"use strict";
const router = require("express")();
const helpers = require("../../modules/helpers");
const paymentsManager = require("../../managers/Payments.js");
const base = require("../../middlewares/Base");
const { stripePayment } = require("../../managers/Payments.js");
const config = require("../../config/" + process.env.PROJECT + ".config.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/* buy tracks and payment through stripe */
router.post("/stripe", (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  paymentsManager
    .stripePayment(reqObj)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/paypal/createOrder", async (req, res, next) => {
  const reqObj = Object.assign({}, req._request);

  paymentsManager
    .paypalCreateOrder(reqObj)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/paypal/captureOrder", async (req, res, next) => {
  const reqObj = Object.assign({}, req._request);

  paymentsManager
    .paypalCaptureOrder(reqObj)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/onboarding/:user_id", (req, res, next) => {
  paymentsManager
    .generateOnboardingLink({ user_id: req.params.user_id })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
});
router.post(
  "/createtransfer",
  (req, res, next) => {
    base.validateRequest(req, res, next, ["amount"]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    const amount = Number(reqObj.amount);

    if (amount < config.WITHDRAW_AMOUNT_THRESHOLD)
      res
        .status(400)
        .json("$" + config.WITHDRAW_AMOUNT_THRESHOLD + " needed to withdraw.");
    else next();
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    const availableBalance = base.availableBalanceInWalletToWithdraw(
      req,
      res,
      next,
      reqObj.user_id
    );
    // next(availableBalance);
  },
  (availableBalance, req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    const amountToTransfer = reqObj.amount;

    if (amountToTransfer > availableBalance)
      res.status(400).json("Insufficient balance.");
    else next();
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    paymentsManager
      .createTransfer(reqObj)
      .then((data) => {
        if (data == "Invalid Amount") res.status(200).json(data);
        res.status(200).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

router.get("/getCardInfo", async (req, res, next) => {
  const decodedResponse = await helpers.verifyJWT(req.headers.auhtorization);
  paymentsManager
    .getCardInfo(decodedResponse)
    .then((data) => {
      res.status(200).json({ data });
      return data.card;
    })
    .catch((err) => {
      next(err);
    });
});
module.exports = router;
