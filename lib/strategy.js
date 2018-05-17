/**
 * Dependencies
 */
var OAuth2Strategy      = require('passport-oauth2')
  , InternalOAuthError  = require('passport-oauth2').InternalOAuthError
  , util = require('util');

/**
 * `Strategy` constructor.
 *
 * The Twitch authentication strategy authenticates requests by delegating to
 * Twitch using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      Twitch application's client id
 *   - `clientSecret`  Twitch application's client secret
 *   - `callbackURL`   URL that Twitch will redirect the user to after granting authorization
 *
 * Examples:
 *
 *    passport.use(new TwitchStrategy({
 *        clientID: "123-456-789",
 *        clientSecret: "twitch-secret-key"
 *        callbackURL: "https://www.example.com/auth/twitch/callback"
 *      },
 *      function(accessToken, refreshToken, profile, done) {
 *        User.findOrCreate(..., function (err, user) {
 *          done(err, user)
 *        })
 *      }
 *    ))
 *
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://id.twitch.tv/oauth2/authorize';
  options.tokenURL = options.tokenURL || 'https://id.twitch.tv/oauth2/token';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'twitch';

  this._oauth2.setAuthMethod("Bearer");
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Twitch.
 * 
 * This function constructs a normalized profile.
 * Along with the properties returned from /users/@me, properties returned include:
 * 
 *   - `provider` Always set to `twitch`
 *   - `id` The users ID.
 *   - `displayName` The users display name.
 *   - `username` The users username.
 * 
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  this._oauth2.get("https://api.twitch.tv/helix/users", accessToken, function (err, body, res) {
    if (err) { return done(new InternalOAuthError('Failed to fetch user profile', err)); }
 
    try {
      var json = JSON.parse(body).data[0];

      var profile = { provider: 'twitch' };
      profile.id = json.id;
      profile.username = json.login;
      profile.displayName = json.display_name;
      profile.email = json.email;

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
};

/**
 * Return extra parameters to be included in the authorization request.
 *
 * @param {object} options
 * @return {object}
 * @api protected
 */
Strategy.prototype.authorizationParams = function(options) {
  var params = {};
  if (typeof options.forceVerify !== 'undefined') {
    params.force_verify = !!options.forceVerify;
  }
  params.response_type = options.response_type || 'token+id_token';
  return params;
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;