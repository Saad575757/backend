"use strict";
const {
  AccessToken,
  AuthorizationCode,
  Client,
  RefreshToken
} = require("../models/index")["Warbls"];
const Knex1 = require("../models/Warbls")["knex"];
const moment = require("moment");
const config = require("../config/" + process.env.PROJECT + ".config.js");

module.exports.getAccessToken = accessToken => {
  const time = moment().format("YYYY-MM-DD H:m:s");

  return AccessToken.query()
    .where("access_token", accessToken)
    .where("expires_at", ">", time)
    .first()
    .debug()
    .then(token => {
      return Promise.all([
        token,
        Client.query()
          .where("id", token.client_id)
          .first()
      ]);
    })
    .spread((token, client) => {
      return {
        accessToken: token.access_token,
        accessTokenExpiresAt: new Date(token.expires_at),
        scope: token.scope,
        client: client,
        user: {}
      };
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.getRefreshToken = refreshToken => {
  const time = moment().format("YYYY-MM-DD H:m:s");

  return RefreshToken.query()
    .where("refresh_token", refreshToken)
    .where("expires_at", ">", time)
    .first()
    .debug()
    .then(token => {
      return Promise.all([
        token,
        Client.query()
          .where("id", token.client_id)
          .first()
      ]);
    })
    .spread((token, client) => {
      return {
        refreshToken: token.refresh_token,
        refreshTokenExpiresAt: token.expires_at,
        scope: token.scope,
        client: client,
        user: {}
      };
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.getAuthorizationCode = authorizationCode => {
  const time = moment().format("YYYY-MM-DD H:m:s");

  return AuthorizationCode.query()
    .where("authorization_code", authorizationCode)
    .where("expires_at", ">", time)
    .first()
    .then(code => {
      return Promise.all([
        code,
        Client.query()
          .where("id", code.client_id)
          .first()
      ]);
    })
    .spread((code, client) => {
      return {
        code: code.authorization_code,
        expiresAt: code.expires_at,
        redirectUri: code.redirect_uri,
        scope: code.scope,
        client: client,
        user: {}
      };
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.getClient = (clientId, clientSecret) => {
  Client.knex(Knex1);
  const knexObj = Client.query().where("client_id", clientId);

  if (clientSecret) knexObj.where("client_secret", clientSecret);

  return knexObj
    .first()
    .debug()
    .then(client => {
      return {
        id: client.id,
        redirectUris: client.redirect_uri,
        grants: JSON.parse(client.grant_types)
      };
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.saveToken = (token, client, user) => {
  const time = moment()
    .add(config.OAUTH_TOKEN_EXPIRY || 30, "day")
    .format("YYYY-MM-DD H:m:s");
  const refreshTokenTime = moment()
    .add(config.OAUTH_REFRESH_TOKEN_EXPIRY || 31, "day")
    .format("YYYY-MM-DD H:m:s");

  return AccessToken.query()
    .insert({
      access_token: token.accessToken,
      expires_at: time,
      scope: token.scope,
      client_id: client.id,
      user_id: user.id
    })
    .then(accessToken => {
      return Promise.all([
        accessToken,
        RefreshToken.query().insert({
          refresh_token: token.refreshToken,
          expires_at: refreshTokenTime,
          scope: token.scope,
          client_id: client.id,
          user_id: user.id
        }),
        Client.query()
          .where("id", client.id)
          .first()
      ]);
    })
    .spread((accessToken, refreshToken, client) => {
      return {
        accessToken: accessToken.access_token,
        accessTokenExpiresAt: new Date(accessToken.expires_at),
        refreshToken: refreshToken.refresh_token,
        refreshTokenExpiresAt: new Date(refreshToken.expires_at),
        scope: accessToken.scope,
        client: client,
        user: {}
      };
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.saveAuthorizationCode = (code, client) => {
  const time = moment()
    .add(1, "day")
    .format("YYYY-MM-DD HH:m:s");

  return AuthorizationCode.query()
    .insert({
      authorization_code: code.authorizationCode,
      expires_at: time,
      redirect_uri: code.redirectUri,
      scope: code.scope,
      client_id: client.id
    })
    .then(authorizationCode => {
      return {
        authorizationCode: authorizationCode.authorization_code,
        expiresAt: authorizationCode.expires_at,
        redirectUri: authorizationCode.redirect_uri,
        scope: authorizationCode.scope,
        client: { id: authorizationCode.client_id }
      };
    });
};

module.exports.verifyScope = (token, scope) => {
  if (!token.scope) {
    return false;
  }
  const requestedScopes = scope.split(" ");
  const authorizedScopes = token.scope.split(" ");
  return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);
};

module.exports.revokeToken = token => {
  return RefreshToken.query()
    .delete()
    .where("refresh_token", token.refreshToken)
    .debug()
    .then(refreshToken => {
      return !!refreshToken;
    });
};

module.exports.revokeAuthorizationCode = code => {
  return AuthorizationCode.query()
    .delete()
    .where("authorization_code", code.code)
    .debug()
    .then(authorizationCode => {
      return !!authorizationCode;
    })
    .catch(err => {
      console.log(err);
    });
};
