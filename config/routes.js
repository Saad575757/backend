"use strict";
module.exports = function(app) {
  app.use("/s3/", require("../controllers/FileUploading/FileUploading"));
  app.use("/users", require("../controllers/Users/Users"));
  app.use("/auth", require("../controllers/Auth"));
  app.use("/promo-codes", require("../controllers/PromoCodes/PromoCodes"));
  app.use("/tracks", require("../controllers/Tracks/Tracks"));
  app.use("/artist-forms", require("../controllers/ArtistForms/ArtistForms"));
  app.use("/payment", require("../controllers/Payments/Payments"));
  app.use("/stats", require("../controllers/TrackStats/TrackStats"));
  app.use("/orders", require("../controllers/Orders/Orders"));
  app.use("/transactions", require("../controllers/Transactions/Transactions"));
};
