
const express = require("express");
const mongoose = require('mongoose');
const passport = require("passport");
var logger = require('morgan');
const authRouter = require('../routes/auth')
const helmet = require("helmet");
var cors = require('cors')
var cookieParser = require('cookie-parser');
require('dotenv').config()

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet())
app.use(cookieParser());
const mongoString = process.env.MONGOSTRING;

main()
.then(()=> console.log('Happily connected'))
.catch((err)=> console.log(err))

async function main(){
   await mongoose.connect(mongoString)
}
  
require("../config/passport")(passport)
app.use(passport.initialize())
app.use(logger('dev'));


  var allowlist = ['http://localhost:5173','http://localhost:5174',]
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = {credentials : true, origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(cors(corsOptionsDelegate))


app.use('/api/', authRouter)

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;