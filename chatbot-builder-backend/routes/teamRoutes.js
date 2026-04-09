const express = require('express');
const {
  getTeam,
  updateTeamSettings,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
  getActivityLog,
  getRoles,
  exportActivityLog,
  getMemberDetails,
  resendInvitation
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Team management
router.route('/')
  .get(getTeam);

router.put('/settings', updateTeamSettings);

// Roles
router.get('/roles', getRoles);

// Member management
router.get('/members/:memberId', getMemberDetails);
router.put('/members/:memberId/role', updateMemberRole);
router.delete('/members/:memberId', removeMember);

// Invitations
router.post('/invite', inviteMember);
router.post('/invite/accept', acceptInvitation);
router.post('/invite/:inviteId/resend', resendInvitation);

// Activity log
router.get('/activity', getActivityLog);
router.get('/activity/export', exportActivityLog);

module.exports = router;