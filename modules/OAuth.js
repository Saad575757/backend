"use strict";
const oauthServer = require("oauth2-server");
const Request = oauthServer.Request;
const Response = oauthServer.Response;

const oauth = new oauthServer({
  model: require("./OAuthModel")
});

/*
 * invokes Model#getAccessToken() function and return promise
 */
module.exports.authenticateHandler = (options = {}) => {
  return (req, res) => {
    const request = new Request(req);
    const response = new Response(res);

    return oauth.authenticate(request, response, options);
  };
};

/*
 * invokes Model#saveAuthorizationCode() function and return promise
 */
module.exports.authorizeHandler = (options = {}) => {
  return (req, res) => {
    const request = new Request(req);
    const response = new Response(res);

    options = {
      authenticateHandler: {
        // eslint-disable-next-line no-unused-vars
        handle: data => {
          // Whatever you need to do to authorize / retrieve your user from post data here
          return { id: req.body.client_id };
        }
      }
    };

    return oauth
      .authorize(request, response, options)
      .then(token => {
        res.json({ oauth: { token: token } });
      })
      .catch(err => {
        console.log(err);
        res.status(err.code || 500).json(err);
      });
  };
};

/*
 * invokes Model#saveToken() function and return promise
 */
module.exports.tokenHandler = (options = {}) => {
  return (req, res) => {
    const request = new Request(req);
    const response = new Response(res);

    return oauth
      .token(request, response, options)
      .then(token => {
        res.json({ oauth: { token: token } });
      })
      .catch(err => {
        res.status(err.code || 500).json(err);
      });
  };
};
