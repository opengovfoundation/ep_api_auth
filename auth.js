settings = require('../../src/node/utils/Settings');
var cookieParser = require('ep_etherpad-lite/node_modules/cookie-parser');
var session = require('ep_etherpad-lite/node_modules/express-session');
var http = require('http');

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

  if(args.req.url.substring(0,3) === '/p/' && args.req.url.length > 3) {
    var docSlug = args.req.url.substring(3);

    // Sometimes we get a slug that is the string 'undefined', for some reason.
    // Ignore this.
    // TODO: Fix this.
    if(docSlug !== 'undefined')
    {

      var cookies = args.req.cookies;

      var options = {
        'hostname': 'editor.madison.localhost',
        'port': 80,
        'path': '/api/docs/' + docSlug,
        'method': 'GET',
        'headers' : {
          'Cookie': getAsUriParameters(cookies) // This doesn't work yet.
        }
      };

      var request = http.request(options, function(response) {

        response.on('data', function (chunk) {
          if(response.statusCode !== 200) {
            cb([false]);
          }
          else {
            cb([true]);
          }
        });
      });
      request.end()
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
  args.res.redirect('/');

  /*
  console.debug("Database Write -> oauthredirectlookup:"+args.req.sessionID, "---", args.req.url);
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


