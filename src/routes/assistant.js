const express = require('express');
const router = express.Router();
const { processCommand } = require('../controllers/assistantController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.post('/command', processCommand);

module.exports = router;
