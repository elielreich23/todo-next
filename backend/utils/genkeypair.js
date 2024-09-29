const crypto = require('crypto')
const fs = require('fs')

function genkey(){
    const keypair = crypto.generateKeyPairSync('rsa',{
        modulusLength : 4096,
        publicKeyEncoding : {
            type : 'pkcs1',
            format : 'pem'
        },
        privateKeyEncoding : {
            type : 'pkcs1',
            format : 'pem'
        }
    })

    fs.writeFileSync(__dirname + '/pubKey.pem', keypair.publicKey)
    fs.writeFileSync(__dirname + '/privKey.pem', keypair.privateKey)
}

genkey()

