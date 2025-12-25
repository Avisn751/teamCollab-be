const express = require('express');
const router = express.Router();
const { 
  getTeam, 
  updateTeam, 
  getTeamMembers, 
  addTeamMember, 
  updateTeamMember, 
  removeTeamMember 
} = require('../controllers/teamController');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.get('/', getTeam);
router.put('/', requireRole('ADMIN'), updateTeam);
router.get('/members', getTeamMembers);
router.post('/members', requireRole('ADMIN', 'MANAGER'), addTeamMember);
router.put('/members/:memberId', requireRole('ADMIN'), updateTeamMember);
router.delete('/members/:memberId', requireRole('ADMIN'), removeTeamMember);

module.exports = router;
