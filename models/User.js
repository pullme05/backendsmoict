const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// สร้าง Schema สำหรับ User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // ตรวจสอบให้ username เป็นตัวเลขเฉพาะเมื่อ role เป็น user
        if (this.role === 'admin') return true;
        return /^[0-9]+$/.test(v); // ถ้าเป็น user ต้องเป็นตัวเลข
      },
      message: props => `${props.value} is invalid for the role ${this.role}.`
    }
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  studentID: {
    type: Number,
    required: function() {
      return this.role === 'user'; // ถ้า role เป็น user ต้องกรอก studentID
    },
    unique: true,
    match: /^[0-9]{8}$/ // รหัสนิสิตที่มีตัวเลข 8 หลัก
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // ข้ามถ้ารหัสผ่านไม่ถูกแก้ไข

  try {
    const salt = await bcrypt.genSalt(10); // สร้าง salt
    this.password = await bcrypt.hash(this.password, salt); // เข้ารหัสรหัสผ่าน
    next();
  } catch (err) {
    next(err);
  }
});

// สร้างฟังก์ชันสำหรับตรวจสอบรหัสผ่าน
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password); // เปรียบเทียบรหัสผ่านที่เข้ารหัสแล้ว
};

// สร้างโมเดล
const User = mongoose.model('User', userSchema);

module.exports = User;
