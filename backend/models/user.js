const mongoose = require('mongoose');
const { type } = require('os');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  emailConfirmedStatus : {
    type : Boolean,
    required: true,
    default : false
  }
});

module.exports = mongoose.model('User', userSchema);
