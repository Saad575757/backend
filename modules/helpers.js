'use strict';
require('dotenv').config({ path: require('app-root-path') + '/.env' });
const models = require('../models')['Warbls'];
const md5 = require('crypto-js/md5');
const http = require('http');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('../config/' + process.env.PROJECT + '.config.js');
const jwt = require('jsonwebtoken');

const bbPromise = require('bluebird');
// loading aws promise dependency
aws.config.setPromisesDependency(bbPromise);

module.exports.setParams = (req, res, next) => {
  // global._request = {};

  if ('body' in req && Object.keys(req.body).length !== 0) {
    // global._request = req.body;
    req._request = req.body;
  } else if ('query' in req && Object.keys(req.query).length !== 0) {
    // global._request = req.query;
    req._request = req.query;
  }

  next();
};

module.exports.errorHanlder = (err, req, res) => {
  console.log(err);
  // set locals, only providing error in development
  const error = {};
  error.message = err.message;
  error.stacktrace = err.stack;

  // draftAnEmail(req,error,err.status);
  // render the error page
  res.status(err.status || 500);
  // draftAnEmail(req,error,err.status);

  if (err.status != 400) {
    // if (
    //   process.env.APPLICATION_ENV === "production" ||
    //   process.env.APPLICATION_ENV === "development"
    // ) {
    //   console.log("Email is going to send.");
    //   module.exports.draftAnEmail(req, error, err.status);
    // }

    // do nothing
    console.log('Iam in errorHandler');
    console.log('Iam in errorHandler');
    console.log('Iam in errorHandler');
  }
  res.json(err.code);
};

module.exports.responseMessage = (code) => {
  const message = {};
  message['message'] = http.STATUS_CODES[code];
  return message;
};

module.exports.omit = (object, props) => {
  for (const i in props)
    if (object.hasOwnProperty(props[i])) delete object[props[i]];

  return object;
};

module.exports.notFound = (req, res) => {
  const err = new Error('Not Found');
  err.status = 404;
  res.status(err.status).json(module.exports.responseMessage(err.status));
  // next(err);
};

module.exports.validateRequest = (req, res, next, requireParams = []) => {
  if (requireParams.length === 0) return next();
  else {
    const result = [];
    const data = req._request;

    requireParams.forEach((param) => {
      if (typeof data[param] == 'undefined')
        result.push(param + ' is missing in request');
    });

    if (result.length === 0) return next();
    else res.status(400).json(result);
  }
};

module.exports.buildWhere = (knexObj, object, data) => {
  const modelAttr = object.getJsonSchema().default;
  const tableName = object.getTableName();

  for (const key in data) {
    if (modelAttr.indexOf(key) !== -1) {
      const condKey = tableName + '.' + key;

      if (data[key] instanceof Array) knexObj.whereIn(condKey, data[key]);
      else knexObj.where(condKey, data[key]);
    }
  }

  return knexObj;
};

module.exports.securePassword = (password) => {
  const encryptedMd5Pass = md5(password).toString();
  return encryptedMd5Pass.toString();
};

module.exports.buildModel = (object, data) => {
  const modelAttr = object.getJsonSchema().default;
  const modelData = {};

  for (const key in data)
    if (modelAttr.indexOf(key) !== -1) modelData[key] = data[key];

  return modelData;
};

const load = (loadArr, model, namespace = 'main') => {
  // let _loadArr = loadArr;
  const _loadArr = loadArr.slice(0); //
  let _eager = '[';

  loadArr.forEach((key) => {
    if (key in model.relationArray) {
      _eager += key + ',';

      _loadArr.splice(loadArr.indexOf(key), 1);

      if ('model' in model.relationArray[key]) {
        const child = models[model.relationArray[key].model];
        _loadArr.splice(loadArr.indexOf(key), 1); //

        if (
          typeof child !== 'undefined' &&
          'relationArray' in child &&
          module.exports.isArrayIntersect(
            _loadArr,
            Object.keys(child.relationArray)
          )
        ) {
          _eager += key + '.' + load(_loadArr, child, namespace);
        }
      }
    }
  });

  _eager = _eager.replace(/,+$/, '') + ']';

  return _eager;
};

module.exports.dateConditions = (knexObj, dates, data) => {
  const requestData = data;

  dates.forEach((key) => {
    if (key + '_from' in requestData)
      knexObj.where(key, '>=', requestData[key + '_from']);

    if (key + '_to' in requestData)
      knexObj.where(key, '<=', requestData[key + '_to']);
  });

  return knexObj;
};

module.exports.getSortOrder = (knexObj, orderBy, modelAttr) => {
  let sortOrder = 'ASC';
  let sortKey = null;

  if (orderBy.indexOf('-') === 0) {
    sortOrder = 'DESC';
    sortKey = orderBy.substr(1);
  } else {
    sortOrder = 'ASC';
    sortKey = orderBy;
  }

  if (modelAttr.indexOf(sortKey) !== -1) knexObj.orderBy(sortKey, sortOrder);

  return knexObj;
};

module.exports.list = (
  model,
  data,
  namespace = 'Warbls',
  sync = false,
  dates = []
) => {
  let _limit = 60;
  let _offset = 0;
  let _eager = '';
  let knexObj = model.query();
  if (data !== undefined && 'offset' in data) _offset = parseInt(data.offset);

  if (data !== undefined && 'limit' in data) _limit = parseInt(data.limit);

  if (data !== undefined && 'order_by' in data) {
    const orderBy = data['order_by'];
    const modelAttr = model.getJsonSchema().default;

    if (orderBy instanceof Array)
      for (const key in orderBy)
        knexObj = module.exports.getSortOrder(knexObj, orderBy[key], modelAttr);
    else knexObj = module.exports.getSortOrder(knexObj, orderBy, modelAttr);
  }

  knexObj = module.exports.buildWhere(knexObj, model, data);

  if (dates) {
    knexObj = module.exports.dateConditions(knexObj, dates, data);
  }

  if (data !== undefined && 'load' in data) {
    if (!(data.load instanceof Array)) data.load = [data.load];

    _eager = load(data.load, model, namespace);
  }

  if (sync) knexObj = module.exports.syncColumn(knexObj, model);
  knexObj.eager(_eager).limit(_limit).offset(_offset).range();

  return knexObj;
};

module.exports.upload = (bucket, folder = '') => {
  const endLocation = folder != '' ? folder + '/' : '';

  const s3 = new aws.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
  });

  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: config.S3_AWS_FILE_ACL,
      key: (req, file, cb) => {
        cb(null, endLocation + file.originalname);
      },
    }),
  });

  return upload;
};

module.exports.downloadFileLink = (bucket, folder = '', reqObj) => {
  let url = '';

  if ('file_name' in reqObj) {
    const endLocation = folder != '' ? folder + '/' : '';

    const s3 = new aws.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION,
    });

    const myKey = endLocation + reqObj.file_name;

    const signedUrlExpireSeconds = 60 * 5; // your expiry time in seconds.

    url = s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: myKey,
      Expires: signedUrlExpireSeconds,
      ResponseContentDisposition: 'attachment; filename=' + reqObj.file_name,
    });
  }

  return url;
};

module.exports.verifyJWT = async (token) => {
  return jwt.verify(token, config.JWT_SECRET_KEY, (err, decoded) => {
    return { err: err, decoded: decoded };
  });
};

module.exports.isArrayIntersect = (arr1, arr2) => {
  for (const key in arr1) if (key in arr2) return true;
  return false;
};
