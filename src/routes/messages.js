const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getMessages);
router.post('/', sendMessage);

module.exports = router;
