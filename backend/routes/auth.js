const express = require('express');
const asynchandler = require('express-async-handler');
const authcontroller = require('../controllers/authControllers');

const router = express.Router();

router.post('/api/v1/signup', asynchandler(authcontroller.signup));

router.post('/api/v1/signin', asynchandler(authcontroller.signin));

module.exports = router;
