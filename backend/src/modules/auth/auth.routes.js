'use strict';
const { Router } = require('express');
const controller = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.getMe);

module.exports = router;
