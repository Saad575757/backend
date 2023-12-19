"use strict";
const router = require("express")();
const helpers = require("../../modules/helpers");
const config = require("../../config/" + process.env.PROJECT + ".config.js");
// const upload          = require('../../config/config.uploading');

/* S3 File Uploading */
router.post(
  "/upload",
  helpers
    .upload(config.S3_BUCKET, config.S3_ATTACHMENTS_FOLDER)
    .single("files"),
  function(req, res) {
    if (typeof req.file != "undefined") res.status(200).json(req.file);
    else res.status(204);
  }
);

router.post("/upload-base64", function(req, res) {
  const reqObj = Object.assign(req._request);
  helpers
    .s3Base64Upload(
      reqObj.files,
      reqObj.file_name,
      config.S3_ATTACHMENTS_FOLDER
    )
    .then(s3Url => {
      if (typeof s3Url != "undefined") res.status(200).json(s3Url);
      else res.status(204);
    });
});

/* S3 File Downloading */
router.get(
  "/download-link", 
  (req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    const url = helpers.downloadFileLink(config.S3_BUCKET, config.S3_ATTACHMENTS_FOLDER,reqObj);
    next(url);
  },
  (url , req, res, next) => {
    try{
      if(url != '')
        res.status(200).json(url);
    }catch(err){
      res.status(204).json(err);
    }
  }
);

module.exports = router;
