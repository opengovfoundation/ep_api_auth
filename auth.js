var db = require('ep_etherpad-lite/node/db/DB').db;
settings = require('../../src/node/utils/Settings');
var cookieParser = require('ep_etherpad-lite/node_modules/cookie-parser');
var session = require('ep_etherpad-lite/node_modules/express-session');
var sessionStore = require('ep_etherpad-lite/node/db/SessionStore');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : settings.ep_database_query_auth.hostname,
  user     : settings.ep_database_query_auth.user,
  password : settings.ep_database_query_auth.password,
  database : settings.ep_database_query_auth.database
});
connection.connect(); 
// We keep this connection open..
// It might make more sense to open the connection on query?

// First step
exports.authorize = function(hook_name, args, cb){

  console.log("session from laravel", args.req.cookies.session);
  var sessionID = args.req.sessionID;
  var token = args.req.cookies.session;

  // Here we do a query..  If the query looks wrong or doesn't return an expected value then cb([false])
  // this will just not serve the page though, Ideally we'd deliver a permission denied head or something..
  // This is obviously custom logic depending on your environment..
  connection.query('SELECT user_id FROM sessions where id = '+token, function(err, rows, fields) {
    if (err) throw err;
    console.log("rows", rows);
    console.log("user_id", rows[0].user_id);
    return cb([true]);
  });

}

// SECOND STEP - only gets here if auth fails..
exports.authenticate = function(hook_name, args, cb){
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


