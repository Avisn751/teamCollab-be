const { Team, User } = require('../models');
const { sendInvitationEmail } = require('../config/email');
const { initializeFirebase } = require('../config/firebase');
const crypto = require('crypto');

const generateTempPassword = () => {
  return crypto.randomBytes(4).toString('hex') + '@Temp1';
};

const encryptEmail = (email) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(email, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decryptEmail = (encryptedData) => {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-secret-key', 'salt', 32);
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

const getTeam = async (req, res, next) => {
  try {
    const teamId = req.user.teamId?._id || req.user.teamId;
    const team = await Team.findById(teamId).populate('adminId', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const team = await Team.findByIdAndUpdate(
      teamId,
      { name, description },
      { new: true }
    ).populate('adminId', 'name email');

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

const getTeamMembers = async (req, res, next) => {
  try {
    const teamId = req.user.teamId?._id || req.user.teamId;
    const members = await User.find({ teamId }).select('-firebaseUid');

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

const addTeamMember = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;
    const team = await Team.findById(teamId);
    const inviterName = req.user.name;

    let user = await User.findOne({ email });
    let tempPassword = null;
    let isNewUser = false;
    
    if (user) {
      if (user.teamId && user.teamId.toString() !== teamId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'User already belongs to another team',
        });
      }
      if (user.teamId && user.teamId.toString() === teamId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this team',
        });
      }
      user.teamId = teamId;
      user.role = role || 'MEMBER';
      await user.save();
    } else {
      isNewUser = true;
      tempPassword = generateTempPassword();
      
      const admin = initializeFirebase();
      let firebaseUser;
      
      try {
        firebaseUser = await admin.auth().createUser({
          email: email,
          password: tempPassword,
          displayName: name || email.split('@')[0],
        });
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/email-already-exists') {
          firebaseUser = await admin.auth().getUserByEmail(email);
        } else {
          throw firebaseError;
        }
      }

      user = new User({
        email,
        name: name || email.split('@')[0],
        role: role || 'MEMBER',
        teamId,
        firebaseUid: firebaseUser.uid,
        password: tempPassword,
        tempPassword: tempPassword,
        tempPasswordExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isInvitedUser: true,
        invitedEmail: email,
        isActive: false,
      });
      await user.save();
    }

    if (isNewUser && tempPassword) {
      const encryptedEmail = encryptEmail(email);
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?invite=${encodeURIComponent(encryptedEmail)}`;
      
      const emailResult = await sendInvitationEmail(
        email,
        inviterName,
        team.name,
        tempPassword,
        loginUrl
      );
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
      }
    } else if (!isNewUser) {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      
      const emailResult = await sendInvitationEmail(
        email,
        inviterName,
        team.name,
        'Use your existing password or Google Sign-in',
        loginUrl
      );
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('team:member-added', {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: isNewUser 
        ? 'Member added and invitation email sent' 
        : 'Existing user added to team and notified',
    });
  } catch (error) {
    next(error);
  }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { memberId } = req.params;

    const user = await User.findByIdAndUpdate(
      memberId,
      { role },
      { new: true }
    ).select('-firebaseUid');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const teamId = req.user.teamId?._id || req.user.teamId;
    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('team:member-updated', user);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const removeTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const user = await User.findById(memberId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself from the team',
      });
    }

    const team = await Team.findById(teamId);
    if (team.adminId.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team admin',
      });
    }

    user.teamId = null;
    await user.save();

    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('team:member-removed', { memberId });
    }

    res.json({
      success: true,
      message: 'Member removed from team',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeam,
  updateTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
};
