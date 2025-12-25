const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Message', messageSchema);
