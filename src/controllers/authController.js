const jwt = require('jsonwebtoken');
const { User, Team } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res, next) => {
  try {
    const { email, name, firebaseUid } = req.body;

    let user = await User.findOne({ email });
    
    if (user) {
      if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with different credentials',
        });
      }
      
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        if (name) user.name = name;
        await user.save();
      }
      
      const token = generateToken(user._id);
      user = await User.findById(user._id).populate('teamId');
      
      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            teamId: user.teamId,
            profileImage: user.profileImage,
            isInvitedUser: user.isInvitedUser,
          },
          token,
        },
      });
    }

    const team = new Team({
      name: `${name}'s Team`,
      description: 'Default team',
      adminId: null,
    });

    user = new User({
      email,
      name,
      role: 'ADMIN',
      firebaseUid,
    });

    await user.save();
    
    team.adminId = user._id;
    await team.save();
    
    user.teamId = team._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
          profileImage: user.profileImage,
          isInvitedUser: user.isInvitedUser,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, firebaseUid, password } = req.body;

    let user = await User.findOne({ email }).populate('teamId');
    
    // Password-based login (for invited users with temp password)
    if (password && !firebaseUid) {
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      // Check if temp password has expired
      if (user.tempPasswordExpiry && new Date() > user.tempPasswordExpiry) {
        return res.status(401).json({ success: false, message: 'Temporary password has expired. Please contact admin.' });
      }
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      
      const token = generateToken(user._id);
      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            teamId: user.teamId,
            profileImage: user.profileImage,
            isInvitedUser: user.isInvitedUser,
          },
          token,
        },
      });
    }
    
    // Firebase-based login (existing logic)
    if (user) {
      if (firebaseUid && user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
        user = await User.findById(user._id).populate('teamId');
      }

      const token = generateToken(user._id);

      return res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            teamId: user.teamId,
            profileImage: user.profileImage,
            isInvitedUser: user.isInvitedUser,
          },
          token,
        },
      });
    }
    
    // Create new user if not exists (existing logic)
    const team = new Team({
      name: `New Team`,
      description: 'Auto-created team',
      adminId: null,
    });

    user = new User({
      email,
      name: email.split('@')[0],
      role: 'ADMIN',
      firebaseUid,
    });

    await user.save();
    team.adminId = user._id;
    await team.save();
    user.teamId = team._id;
    await user.save();
    user = await User.findById(user._id).populate('teamId');

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
          profileImage: user.profileImage,
          isInvitedUser: user.isInvitedUser,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('teamId');
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
        profileImage: user.profileImage,
        isInvitedUser: user.isInvitedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    ).populate('teamId');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // If user has a password set, verify current password
    if (user.password) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }
    
    user.password = newPassword;
    user.tempPassword = null;
    user.tempPasswordExpiry = null;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

const updateProfileImage = async (req, res, next) => {
  try {
    const { profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage },
      { new: true }
    ).populate('teamId');
    
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, updateProfileImage };
