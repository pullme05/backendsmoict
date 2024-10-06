const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
