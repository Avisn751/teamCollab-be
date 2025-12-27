const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Team } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
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
        user.isActive = true;
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
            isActive: user.isActive,
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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user = new User({
      email,
      name,
      role: 'ADMIN',
      firebaseUid,
      isActive: false, // Email verification required
      verificationToken,
      verificationTokenExpiry,
    });

    await user.save();
    
    team.adminId = user._id;
    await team.save();
    
    user.teamId = team._id;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
    }

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
          isActive: user.isActive,
        },
        token,
      },
      message: 'Registration successful. Please check your email to verify your account.',
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
            isActive: user.isActive,
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
            isActive: user.isActive,
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
      isActive: true,
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
          isActive: user.isActive,
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
        isActive: user.isActive,
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
    
    // Verify current password. Accept either the stored password (bcrypt) or a valid tempPassword.
    let isMatch = false;

    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }

      isMatch = await user.comparePassword(currentPassword);
    }

    // If not matched against hashed password, allow matching the plaintext tempPassword (if present and not expired)
    if (!isMatch && user.tempPassword) {
      if (user.tempPasswordExpiry && new Date() > user.tempPasswordExpiry) {
        return res.status(400).json({ success: false, message: 'Temporary password has expired. Please contact admin.' });
      }

      if (currentPassword && currentPassword === user.tempPassword) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
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

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }
    let user = await User.findOne({ verificationToken: token });

    if (!user) {
      const used = await User.findOne({ verificationTokenUsed: token });
      if (used && used.isActive) {
      }

      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    if (new Date() > user.verificationTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Verification token has expired' });
    }

    // Mark user as active, record used token and clear verification fields
    user.isActive = true;
    user.verificationTokenUsed = token;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal whether user exists
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetExpiry;
    await user.save();

    const emailResult = await sendPasswordResetEmail(email, resetToken);
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({ passwordResetToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    if (user.passwordResetExpiry && new Date() > user.passwordResetExpiry) {
      return res.status(400).json({ success: false, message: 'Password reset token has expired' });
    }

    user.password = newPassword;
    user.tempPassword = null;
    user.tempPasswordExpiry = null;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, updateProfileImage, verifyEmail };
