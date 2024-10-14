const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentID: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 8,
  },
  phoneNumber: { 
    type: String, 
    required: true // เพิ่ม phoneNumber ให้เป็น required
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['รอการอนุมัติจากผู้ดูแล', 'อนุมัติแล้ว', 'ถูกปฏิเสธ'],
    default: 'รอการอนุมัติจากผู้ดูแล',
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
