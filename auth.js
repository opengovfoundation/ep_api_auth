var settings = require('../../src/node/utils/Settings');
var Promise = require('bluebird');
var request = require('request-promise');
var cookieParser = require('ep_etherpad-lite/node_modules/cookie-parser');
var session = require('ep_etherpad-lite/node_modules/express-session');
var authorManager = require('ep_etherpad-lite/node/db/AuthorManager');
var groupManager = require('ep_etherpad-lite/node/db/GroupManager');
var padManager = require('ep_etherpad-lite/node/db/PadManager');
padManager.getPadAsync = Promise.promisify(padManager.getPad);
authorManager.getAuthor4TokenAsync = Promise.promisify(authorManager.getAuthor4Token);

var apiauthUsername = {};

// First step
exports.authorize = function(hook_name, args, cb){

  function getAsUriParameters(data) {
     var url = '';
     for (var prop in data) {
        url += encodeURIComponent(prop) + '=' +
            encodeURIComponent(data[prop]) + '; ';
     }
     return url.substring(0, url.length - 1)
  }

  // If we've requested a pad.
  if(args.req.url.substring(0,3) === '/p/' && args.req.url.length > 3) {
    var docSlug = args.req.url.substring(3);

    // Sometimes we get a slug that is the string 'undefined', for some reason.
    // Ignore this.
    // TODO: Fix this.
    if(docSlug !== 'undefined')
    {
      // Get the current user
      var userOptions = {
        uri: settings.ep_api_auth.uri + settings.ep_api_auth.userPath,
        method: settings.ep_api_auth.method ? settings.ep_api_auth.method : 'GET',
        json: true,
        headers : {
          Cookie: getAsUriParameters(args.req.cookies)
        }
      };

      // Get the current document.
      var documentOptions = {
        uri: settings.ep_api_auth.uri + settings.ep_api_auth.docPath.replace('{token}', docSlug),
        method: settings.ep_api_auth.method ? settings.ep_api_auth.method : 'GET',
        json: true,
        headers : {
          Cookie: getAsUriParameters(args.req.cookies)
        }
      };

      Promise.all([
        request(userOptions),
        request(documentOptions)
      ])
      .spread(function(userData, documentData) {

        // console.log('got user', userData);
        // console.log('got document', documentData);

        padManager.getPadAsync(documentData.document.id)
          .then(function(pad) {
            if(pad.id !== 'undefined') {
              // console.log('got pad', pad.getAllAuthors());
              // console.log('currently', args.req.cookies, args.req.cookies.token);
              authorManager.getAuthor4TokenAsync(args.req.cookies.token)
                .then(function(authorId) {
                  authorManager.setAuthorName(authorId, userData.user.display_name);
                });
            }
            else {
              padManager.addPad(documentData.document.id);
              // console.log('created pad');
            }
          });

        // authorManager.createAuthorIfNotExistsFor(user.id, user.display_name, function(err, author) {
        //   console.log('author', author);
        // });

        cb([true]);
      })
      .catch( function() { cb([false]); });

    }
    else {
      cb([true]);
    }
  }
  else {
    cb([true]);
  }
}

// SECOND STEP - only gets here if auth fails..
exports.authenticate = function(hook_name, args, cb){

  var sessionID = args.req.sessionID;
  var token = args.req.cookies.session;

  // TODO: We need a way to redirect the parent window.
  var protocol = settings.ep_api_auth.protocol ? settings.ep_api_auth.protocol : 'http';
  var url = protocol + '://' + settings.ep_api_auth.host;

  args.res.send('<script>window.top.location.href = "' + url + '";</script>');

  /*
  console.log("Database Write -> oauthredirectlookup:"+args.req.sessionID, "---", args.req.url);
  db.set("oauthredirectlookup:"+args.req.sessionID, args.req.url);
  // User is not authorized so we need to do the authentication step
  // Gets an authoritzation URL for the user to hit..

  // CAKE TODO -- we use redirect url as state, this seems wrong to me.
  var authURL = oauth2.getAuthorizeUrl({
    redirect_uri: settings.ep_oauth.callbackURL,
    scope: ['user'],
    state: args.req.sessionID,
    target: args.req.url
  });

  args.res.redirect(authURL);
  // CAKE TODO -- This redirect fires a server console error because of when it's fired
  // It might make more sense to send this redirect as a browser script or so..
  // Let's see if it causes issues and if it does we can address it then..
  */
}

exports.handleMessage = function(hook_name, context, cb) {
  console.log("ep_api_auth.handleMessage");
  if( context.message.type == "CLIENT_READY" ) {
    if(!context.message.token) {
      console.log('ep_api_auth.handleMessage: intercepted CLIENT_READY message has no token!');
    } else {
      var client_id = context.client.id;
      var express_sid = context.client.manager.handshaken[client_id].sessionID;
      console.log('ep_api_auth.handleMessage: intercepted CLIENT_READY message for client_id = %s express_sid = %s, setting username for token %s to %s', client_id, express_sid, context.message.token, apiauthUsername);
      apiauthSetUsername(context.message.token, apiauthUsername[express_sid]);
    }
  } else if( context.message.type == "COLLABROOM" && context.message.data.type == "USERINFO_UPDATE" ) {
    console.log('ep_api_auth.handleMessage: intercepted USERINFO_UPDATE and dropping it!');
    return cb([null]);
  }
  return cb([context.message]);
}

function apiauthSetUsername(token, username) {
      console.log('ep_apiauth.apiauthSetUsername: getting authorid for token %s', token);
      authorManager.getAuthor4Token(token, function(err, author) {
  if(ERR(err)) {
    console.log('ep_apiauth.apiauthSetUsername: error getting author for token %s', token);
    return;
  } else {
    if(author) {
      console.log('ep_apiauth.apiauthSetUsername: have authorid %s, setting username to %s', author, username);
      authorManager.setAuthorName(author, username);
    } else {
      console.log('ep_apiauth.apiauthSetUsername: could not get authorid for token %s', token);
    }
  }
      });
      return;
}
