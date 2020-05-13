const {OAuth2Client} = require('google-auth-library');
const clientId = "982465152706-km6q15g554o40cp0mb7ebqb5r43m22pt.apps.googleusercontent.com"
const client = new OAuth2Client(clientId);
const appId = "2939421862778423";

module.exports = function(User) {
    User.verifyGoogleToken = function(data, next) {
        verify(data.idToken)
            .then(function(response) {
                response.provider = "google";
                return User.signup(response,next);
            })
            .catch(function(error) {
                var err = new Error(error);
                err.statusCode = 400;
                next(err);
            });
    }

    User.verifyFbToken = function(authToken, next) {
        var Facebook = User.app.datasources.Facebook;
        var accessToken = authToken;
        Facebook.verifyApp(accessToken)
	   .then(function(response) {
            var fbAppId = response.data.app_id;
            if(fbAppId == appId){
                return Facebook.me(accessToken);
            }else{
                var err = new Error('Invalid App Id');
                err.statusCode = 400;
                next(err);
            }		  
		})
		.then(function(response) {
            response.provider = "facebook";
            return User.signup(response,next);
        })
       .catch(function(error) {
            var err = new Error(error);
            err.statusCode = 400;
            next(err);
       });
    }

    User.signup = function(profile, next){
        var newUser = {};
        newUser.email = profile.email.toLowerCase();
        newUser.username = profile.email.toLowerCase();
        newUser.password = "runcode";
        newUser.provider = profile.provider.toLowerCase();

        User.findOne({where: {"username":newUser.email}}, function(err, user) {
            if (err) {
                var error = new Error(err);
                error.statusCode = 400;
                next(err);
            }
            if (!user) {
                User.create(newUser, function(error, user) {
                    if (error) {
                        var err = new Error(error);
                        err.statusCode = 400;
                        next(err);
                    } else {
                        return User.signin(newUser,next);
                    }
                });
            }else{
                return User.signin(newUser,next);
            }
        })
    }

    User.signin = function(credentials,next){
        User.login(credentials, function(err,token) {
            if (err) {
                var error = new Error(err);
                error.statusCode = 400;
                next(err);
            }
            next(null, token);
        });
    }

    User.getSum = function(a,b,next){
        next(null,a+b);
    }
}
async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId
  });
  const payload = ticket.getPayload();
  return payload;
}