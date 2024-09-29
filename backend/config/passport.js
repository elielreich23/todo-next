const User = require('../models/user')

const jwtStrategy = require('passport-jwt').Strategy
const extractJwt = require('passport-jwt').ExtractJwt
require("dotenv").config()

const pubKey = process.env.PUB_KEY

const options = {
    jwtFromRequest : extractJwt.fromExtractors([extractJwt.fromAuthHeaderAsBearerToken()]),
    secretOrKey : pubKey,
    algorithms : ['RS256']
};


const strategy = new jwtStrategy(options, async (payload, done)=>{
    const user = await User.findOne({_id : payload.sub}).exec()

    if(user) {
        return done(null, item)
    }else {
        return done(null, false)
    }
})

module.exports = (passport)=>{
    passport.use(strategy)
}