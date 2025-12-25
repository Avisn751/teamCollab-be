const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).populate('teamId');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token.' 
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

const requireTeamMember = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;
    
    if (!teamId) {
      return next();
    }

    if (!req.user.teamId || req.user.teamId.toString() !== teamId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Not a member of this team.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error checking team membership.' 
    });
  }
};

module.exports = { auth, requireRole, requireTeamMember };
