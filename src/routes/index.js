const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const projectRoutes = require('./projects');
const taskRoutes = require('./tasks');
const messageRoutes = require('./messages');
const teamRoutes = require('./team');
const assistantRoutes = require('./assistant');
const notificationsRouter = require('./notifications');

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/messages', messageRoutes);
router.use('/team', teamRoutes);
router.use('/assistant', assistantRoutes);
router.use('/notifications', notificationsRouter);

module.exports = router;
