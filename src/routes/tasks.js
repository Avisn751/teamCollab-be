const express = require('express');
const router = express.Router();
const { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask 
} = require('../controllers/taskController');
const { auth } = require('../middleware/auth');
const { validate, taskSchema, taskUpdateSchema } = require('../validators');

router.use(auth);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', validate(taskSchema), createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
