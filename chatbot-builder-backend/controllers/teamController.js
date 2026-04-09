const Team = require('../models/team');
const TeamActivity = require('../models/teamActivity');
const User = require('../models/user');
const Bot = require('../models/bot');
const catchAsync = require('../utils/catchAsync'); // ✅ FIX 1: Fixed import
const AppError = require('../utils/apiError');
const { sendEmail, templates } = require('../services/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * @desc    Get team for authenticated user
 * @route   GET /api/team
 * @access  Private
 */
exports.getTeam = catchAsync(async (req, res, next) => {
  let team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  })
    .populate('owner', 'fullName email avatar')
    .populate('members.user', 'fullName email avatar role');

  // If no team exists, create one for the user then re-fetch populated
  if (!team) {
    const newTeam = await Team.create({
      name: `${req.user.fullName}'s Team`,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        role: 'owner',
        status: 'active',
        joinedAt: new Date()
      }],
      settings: {
        defaultRole: 'viewer',
        require2FA: false,
        sessionTimeout: 60
      }
    });

    // ✅ FIX 10: Re-fetch after creation to get populated data
    team = await Team.findById(newTeam._id)
      .populate('owner', 'fullName email avatar')
      .populate('members.user', 'fullName email avatar role');
  }

  const activities = await TeamActivity.find({ team: team._id })
    .populate('user', 'fullName avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    data: { team, activities }
  });
});

/**
 * @desc    Update team settings
 * @route   PUT /api/team/settings
 * @access  Private (Owner/Admin only)
 */
exports.updateTeamSettings = catchAsync(async (req, res, next) => {
  const { teamName, defaultRole, require2FA, sessionTimeout, ipWhitelisting } = req.body;

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const isOwner = team.owner.toString() === req.user.id;
  const member = team.members.find(m => m.user.toString() === req.user.id);

  // ✅ FIX 6: Check isOwner first before accessing member.role
  if (!isOwner && (!member || member.role !== 'admin')) {
    return next(new AppError('Not authorized to update team settings', 403));
  }

  if (teamName) team.name = teamName;
  if (defaultRole) team.settings.defaultRole = defaultRole;
  if (require2FA !== undefined) team.settings.require2FA = require2FA;
  if (sessionTimeout) team.settings.sessionTimeout = sessionTimeout;
  if (ipWhitelisting !== undefined) team.settings.ipWhitelisting = ipWhitelisting;

  await team.save();

  await TeamActivity.create({
    team: team._id,
    user: req.user.id,
    action: 'settings_updated',
    entityType: 'settings',
    description: 'Team settings updated'
  });

  res.status(200).json({
    success: true,
    message: 'Team settings updated successfully',
    data: team
  });
});

/**
 * @desc    Invite team member
 * @route   POST /api/team/invite
 * @access  Private (Owner/Admin only)
 */
exports.inviteMember = catchAsync(async (req, res, next) => {
  const { email, role = 'viewer', message } = req.body;

  if (!email) {
    return next(new AppError('Please provide an email address', 400));
  }

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const isOwner = team.owner.toString() === req.user.id;
  const member = team.members.find(m => m.user.toString() === req.user.id);

  // ✅ FIX 6: Check isOwner first before accessing member.role
  if (!isOwner && (!member || member.role !== 'admin')) {
    return next(new AppError('Not authorized to invite members', 403));
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const existingMember = team.members.find(
      m => m.user && m.user.toString() === existingUser._id.toString()
    );
    if (existingMember) {
      return next(new AppError('User is already a team member', 400));
    }
  }

  // ✅ FIX: Store email on member for invited users, user field optional
  const newMember = {
    ...(existingUser && { user: existingUser._id }),
    email, // store email so we can resend invite and identify the member
    role,
    status: 'invited',
    invitedAt: new Date(),
    invitedBy: req.user.id,
    permissions: getRolePermissions(role)
  };

  team.members.push(newMember);
  await team.save();

  // ✅ FIX 9: Store invite token in JWT with expiry so it can be verified
  const inviteToken = generateInviteToken(email, team._id, role);

  await sendEmail({
    email,
    subject: `You're invited to join ${team.name} on BuildSmart`,
    html: templates.teamInvite(req.user.fullName, team.name, role, inviteToken)
  });

  await TeamActivity.create({
    team: team._id,
    user: req.user.id,
    action: 'member_invited',
    entityType: 'user',
    entityId: existingUser ? existingUser._id : null,
    entityName: email,
    description: `Invited ${email} as ${role}`,
    changes: { role }
  });

  res.status(201).json({
    success: true,
    message: `Invitation sent to ${email}`,
    data: {
      email,
      role,
      status: newMember.status
    }
  });
});

/**
 * @desc    Accept team invitation
 * @route   POST /api/team/invite/accept
 * @access  Public (with token)
 */
exports.acceptInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Please provide an invitation token', 400));
  }

  // ✅ FIX 5: Properly verify JWT invite token
  const invitation = verifyInviteToken(token);

  if (!invitation) {
    return next(new AppError('Invalid or expired invitation', 400));
  }

  const team = await Team.findById(invitation.teamId);

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  // Find pending invited member by matching invitedBy + role + status
  const member = team.members.find(
    m => m.status === 'invited' && m.role === invitation.role
  );

  if (!member) {
    return next(new AppError('Invitation not found or already accepted', 404));
  }

  // Update member status
  member.user = req.user.id;
  member.status = 'active';
  member.joinedAt = new Date();
  member.permissions = getRolePermissions(member.role);

  await team.save();

  await TeamActivity.create({
    team: team._id,
    user: req.user.id,
    action: 'member_joined',
    entityType: 'user',
    entityId: req.user.id,
    entityName: req.user.fullName,
    description: `${req.user.fullName} joined the team as ${member.role}`
  });

  res.status(200).json({
    success: true,
    message: 'Successfully joined the team',
    data: {
      team: team.name,
      role: member.role
    }
  });
});

/**
 * @desc    Update member role
 * @route   PUT /api/team/members/:memberId/role
 * @access  Private (Owner only)
 */
exports.updateMemberRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const { memberId } = req.params;

  if (!role) {
    return next(new AppError('Please provide a role', 400));
  }

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  if (team.owner.toString() !== req.user.id) {
    return next(new AppError('Only team owner can change roles', 403));
  }

  const member = team.members.find(m => m._id.toString() === memberId);

  if (!member) {
    return next(new AppError('Member not found', 404));
  }

  if (member.role === 'owner') {
    return next(new AppError('Cannot change owner role', 400));
  }

  const oldRole = member.role;
  member.role = role;
  member.permissions = getRolePermissions(role);

  await team.save();

  await TeamActivity.create({
    team: team._id,
    user: req.user.id,
    action: 'role_changed',
    entityType: 'user',
    entityId: member.user,
    entityName: memberId, // ✅ FIX 11: use memberId - member.user is ObjectId not populated
    description: `Changed role from ${oldRole} to ${role}`,
    changes: {
      before: { role: oldRole },
      after: { role }
    }
  });

  res.status(200).json({
    success: true,
    message: 'Member role updated successfully',
    data: { memberId, role }
  });
});

/**
 * @desc    Remove team member
 * @route   DELETE /api/team/members/:memberId
 * @access  Private (Owner/Admin only)
 */
exports.removeMember = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const isOwner = team.owner.toString() === req.user.id;
  const member = team.members.find(m => m.user && m.user.toString() === req.user.id);

  // ✅ FIX 7: Check isOwner first before accessing member.role
  if (!isOwner && (!member || member.role !== 'admin')) {
    return next(new AppError('Not authorized to remove members', 403));
  }

  const memberToRemove = team.members.find(m => m._id.toString() === memberId);

  if (!memberToRemove) {
    return next(new AppError('Member not found', 404));
  }

  if (memberToRemove.role === 'owner') {
    return next(new AppError('Cannot remove team owner', 400));
  }

  // ✅ FIX 8: Check user exists before calling toString()
  if (memberToRemove.user && memberToRemove.user.toString() === req.user.id) {
    return next(new AppError('Cannot remove yourself from team', 400));
  }

  team.members = team.members.filter(m => m._id.toString() !== memberId);
  await team.save();

  await TeamActivity.create({
    team: team._id,
    user: req.user.id,
    action: 'member_removed',
    entityType: 'user',
    entityId: memberToRemove.user || null,
    entityName: memberId, // ✅ FIX 11: use memberId - user field may be null
    description: `Removed member from team`
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from team successfully'
  });
});

/**
 * @desc    Get team activity log
 * @route   GET /api/team/activity
 * @access  Private
 */
exports.getActivityLog = catchAsync(async (req, res, next) => {
  const { limit = 50, page = 1, action, user, startDate, endDate } = req.query;

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const query = { team: team._id };

  if (action && action !== 'all') query.action = action;
  if (user) query.user = user;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const activities = await TeamActivity.find(query)
    .populate('user', 'fullName avatar email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await TeamActivity.countDocuments(query);

  res.status(200).json({
    success: true,
    count: activities.length,
    total: count,
    page: Math.ceil(count / limit),
    data: activities
  });
});

/**
 * @desc    Get available roles
 * @route   GET /api/team/roles
 * @access  Private
 */
exports.getRoles = catchAsync(async (req, res, next) => {
  const roles = [
    {
      id: 'owner',
      name: 'Owner',
      description: 'Full access to all features and settings',
      canBeAssigned: false,
      permissions: getRolePermissions('owner')
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Administrative access with some restrictions',
      canBeAssigned: true,
      permissions: getRolePermissions('admin')
    },
    {
      id: 'editor',
      name: 'Editor',
      description: 'Can create and edit bots, view analytics',
      canBeAssigned: true,
      permissions: getRolePermissions('editor')
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access to analytics and conversations',
      canBeAssigned: true,
      permissions: getRolePermissions('viewer')
    }
  ];

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles
  });
});

/**
 * @desc    Export team activity log
 * @route   GET /api/team/activity/export
 * @access  Private
 */
exports.exportActivityLog = catchAsync(async (req, res, next) => {
  const { format = 'csv', startDate, endDate } = req.query;

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const query = { team: team._id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const activities = await TeamActivity.find(query)
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(10000);

  if (format === 'csv') {
    const headers = ['Date', 'User', 'Email', 'Action', 'Description', 'Entity'];

    const rows = activities.map(activity => [
      activity.createdAt.toISOString(),
      activity.user?.fullName || 'System',
      activity.user?.email || '',
      activity.action,
      activity.description,
      activity.entityName || ''
    ]);

    const csvContent = [headers, ...rows].map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=team-activity-${Date.now()}.csv`
    );
    res.send(csvContent);
  } else {
    return next(new AppError('Unsupported export format', 400));
  }
});

/**
 * @desc    Get team member details
 * @route   GET /api/team/members/:memberId
 * @access  Private
 */
exports.getMemberDetails = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  }).populate('members.user', 'fullName email avatar role');

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const member = team.members.find(m => m._id.toString() === memberId);

  if (!member) {
    return next(new AppError('Member not found', 404));
  }

  const activities = await TeamActivity.find({
    team: team._id,
    user: member.user
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    success: true,
    data: { member, activities }
  });
});

/**
 * @desc    Resend invitation
 * @route   POST /api/team/invite/:inviteId/resend
 * @access  Private
 */
exports.resendInvitation = catchAsync(async (req, res, next) => {
  const { inviteId } = req.params;

  // Get email from body since schema doesn't store email on member
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide the invitee email address', 400));
  }

  const team = await Team.findOne({
    $or: [
      { owner: req.user.id },
      { 'members.user': req.user.id }
    ]
  });

  if (!team) {
    return next(new AppError('Team not found', 404));
  }

  const member = team.members.find(
    m => m._id.toString() === inviteId && m.status === 'invited'
  );

  if (!member) {
    return next(new AppError('Invitation not found', 404));
  }

  // ✅ Use stored email from member record
  const memberEmail = member.email || email;

  if (!memberEmail) {
    return next(new AppError('Could not determine invitee email', 400));
  }

  const inviteToken = generateInviteToken(memberEmail, team._id, member.role);

  await sendEmail({
    email: memberEmail,
    subject: `Reminder: Join ${team.name} on BuildSmart`,
    html: templates.teamInvite('Your team admin', team.name, member.role, inviteToken)
  });

  res.status(200).json({
    success: true,
    message: `Invitation resent to ${memberEmail}`
  });
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getRolePermissions(role) {
  const permissions = {
    owner: [
      'full_access', 'manage_team', 'manage_billing', 'manage_bots',
      'manage_integrations', 'view_analytics', 'create_bots', 'edit_bots',
      'delete_bots', 'manage_api_keys', 'view_audit_logs'
    ],
    admin: [
      'manage_team', 'manage_bots', 'manage_integrations', 'view_analytics',
      'create_bots', 'edit_bots', 'delete_bots', 'view_audit_logs'
    ],
    editor: [
      'create_bots', 'edit_bots', 'view_analytics',
      'view_conversations', 'manage_integrations'
    ],
    viewer: [
      'view_analytics', 'view_conversations', 'view_bots'
    ]
  };

  return permissions[role] || permissions.viewer;
}

/**
 * ✅ FIX 9: Generate invite token using JWT so it can be verified without DB
 */
function generateInviteToken(email, teamId, role) {
  return jwt.sign(
    { email, teamId: teamId.toString(), role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * ✅ FIX 5: Properly verify JWT invite token
 */
function verifyInviteToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}