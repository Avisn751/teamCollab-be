const { Message } = require('../models');

const getMessages = async (req, res, next) => {
  try {
    const teamId = req.user.teamId?._id || req.user.teamId;
    const { limit = 50, before } = req.query;

    let query = { teamId };
    
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const teamId = req.user.teamId?._id || req.user.teamId;

    const message = new Message({
      content,
      senderId: req.user._id,
      teamId,
      timestamp: new Date(),
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(teamId.toString()).emit('message:new', populatedMessage);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
};
