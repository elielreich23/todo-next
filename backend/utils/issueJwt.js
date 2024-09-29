const jsonwebtoken = require('jsonwebtoken')
require('dotenv').config()

const privKey = process.env.PRIV_KEY

function issueLoginJwt (user){
    const _id = user._id
    const expiresIn = '1h'

    const payload  = {
        sub :  _id
    }

    const token = jsonwebtoken.sign(payload, privKey, {expiresIn : expiresIn, algorithm : 'RS256'})

    return {
        token,
        expires : expiresIn
    }
}

module.exports = {issueLoginJwt}