"use strict";
const router = require("express")();
const models = require("../../models/")["Warbls"];
const usersManager = require("../../managers/Users");
const usersMw = require("../../middlewares/Users");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.get("/", (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  usersManager
    .getUsersInfo(reqObj)
    .then((data) => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

router.post(
  "/",
  (req, res, next) => {
    usersMw.validateRequest(req, res, next, [
      "username",
      "full_name",
      "email",
      "password",
    ]);
  },
  (req, res, next) => {
    usersMw.duplicateCheckParams(req, res, next, models.Users, ["email"], "F");
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    usersManager
      .addUser(reqObj)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

router.put(
  "/:user_id",
  (req, res, next) => {
    usersMw.validateRequest(req, res, next, ["log"]);
  },
  (req, res, next) => {
    usersMw.duplicateCheckParams(
      req,
      res,
      next,
      models.Users,
      ["username"],
      "T"
    );
  },
  (req, res, next) => {
    usersMw.duplicateCheckParams(req, res, next, models.Users, ["email"], "T");
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    usersManager
      .updateUser(reqObj, req.params.user_id)
      .then(function (data) {
        res.status(200).json(data);
      })
      .catch(function (err) {
        next(err);
      });
  }
);

router.get("/types", (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  usersManager
    .getUsersTypes(reqObj)
    .then((data) => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/reports", (req, res, next) => {
  const reqObj = Object.assign({}, req._request);
  usersManager
    .getUsersReports(reqObj)
    .then((data) => {
      if (data.total > 0) res.status(200).json(data);
      else res.status(204).send();
    })
    .catch(function (err) {
      next(err);
    });
});

router.post(
  "/reports",
  (req, res, next) => {
    usersMw.validateRequest(req, res, next, ["user_id", "reported_by", "type"]);
  },
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    usersManager
      .addUserReport(reqObj)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        next(err);
      });
  }
);

router.post("/forgetPassword", (req, res, next) => {
  const token = crypto.randomBytes(20).toString("hex");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: `${process.env.EMAIL_ADDRESS}`,
      pass: `${process.env.EMAIL_PASSWORD}`,
    },
  }); 
  const mailOptions = {
    from: "warbls.vocals@gmail.com",
    to: `${req.body.email}`,
    subject: "Warbls Link To Reset Password",
    text:
      "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
      "Please click on the following link, or paste this into your browser to complete the process :\n\n" +
      `https://warbls.com/reset/${token}\n\n` +
      "If you did not request this, please ignore this email and your password will remain unchanged.\n",
  };

  transporter.sendMail(mailOptions, (err, _) => {
    if (err) {
      res.status(500).json(err);
    } else {
      const reqObj = Object.assign(
        {},
        { ...req._request, reset_password_hash: token }
      );

      usersManager
        .updateUser(reqObj, req.body.id)
        .then(function (data) {
          res.status(200).json({ message: "recovery email sent" });
        })
        .catch(function (err) {
          res.status(500).json({ error: err });
        });
    }
  });
});

module.exports = router;
