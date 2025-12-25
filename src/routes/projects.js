const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/projectController');
const { auth, requireRole } = require('../middleware/auth');
const { validate, projectSchema, projectUpdateSchema } = require('../validators');

router.use(auth);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', requireRole('ADMIN', 'MANAGER'), createProject);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), updateProject);
router.delete('/:id', requireRole('ADMIN'), deleteProject);

module.exports = router;
