const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  image: String,
  category: String,
  name: String,
  date: Date,
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('News', NewsSchema);
