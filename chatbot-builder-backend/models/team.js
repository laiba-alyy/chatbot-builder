const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // ✅ FIX: not required - invited members may not have an account yet
    },
    email: String, // ✅ store email for invited members who don't have accounts yet
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'invited', 'suspended'],
      default: 'pending'
    },
    invitedAt: Date,
    joinedAt: Date,
    permissions: [String],
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    defaultRole: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    require2FA: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 60 },
    ipWhitelisting: { type: Boolean, default: false },
    allowedIPs: [String]
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalBots: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Virtual for member users
teamSchema.virtual('memberUsers', {
  ref: 'User',
  localField: 'members.user',
  foreignField: '_id'
});

// Indexes
teamSchema.index({ owner: 1 });
teamSchema.index({ 'members.user': 1 });

// ✅ FIX: async pre-save hook - no next() needed
teamSchema.pre('save', async function () {
  this.stats.totalMembers = this.members.length;
  this.stats.activeMembers = this.members.filter(m => m.status === 'active').length;
});

teamSchema.methods.addMember = async function (userId, role, invitedBy) {
  const existing = this.members.find(m => m.user.toString() === userId.toString());
  if (existing) throw new Error('User is already a member');

  this.members.push({
    user: userId,
    role,
    invitedBy,
    invitedAt: new Date(),
    status: 'invited'
  });

  await this.save();
  return this.members[this.members.length - 1];
};

teamSchema.methods.updateMemberRole = function (userId, role) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.role = role;
    return this.save();
  }
  return Promise.reject(new Error('Member not found'));
};

teamSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

teamSchema.methods.hasPermission = function (userId, permission) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member || member.status !== 'active') return false;

  const rolePermissions = {
    owner: ['all'],
    admin: ['manage_bots', 'view_analytics', 'manage_integrations', 'manage_team'],
    editor: ['create_bots', 'edit_bots', 'view_analytics'],
    viewer: ['view_analytics', 'view_conversations']
  };

  const perms = [...(rolePermissions[member.role] || []), ...(member.permissions || [])];
  return perms.includes('all') || perms.includes(permission);
};

module.exports = mongoose.model('Team', teamSchema);