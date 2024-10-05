const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
}, { timestamps: true });

const News = mongoose.model('News', newsSchema);
module.exports = News;
