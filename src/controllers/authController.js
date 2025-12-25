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
    const { email, firebaseUid } = req.body;

    let user = await User.findOne({ email }).populate('teamId');
    
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
          },
          token,
        },
      });
    }
    
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
      data: user,
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

module.exports = { register, login, getMe, updateProfile };
