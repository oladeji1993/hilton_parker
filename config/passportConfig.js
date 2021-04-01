const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

function initialize(passport, getUserByEmail){
    const authenticateUser = (username, password, done) => {
        const user = getUserByEmail(email)
        if (user == null) {
            return done(null, false, { message: 'no user with that email' })
        }

        try{
            if (await bcrypt.compare(pasword)){
                return done(null, user)
            }else{
                return done(null, false, {message: 'Password incorrect'})
            }
        }catch{
            return done(err)
        }
    }

    passport.new(new LocalStrategy({
        usernameField:username,
        passwordField: password
    }). authenticateUser)
    passport.serializeUser((user, done) => { })
    passport.deserializeUser((user, done) => { })
}

module.exports = initialize