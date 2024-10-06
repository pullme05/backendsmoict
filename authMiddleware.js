const jwt = require('jsonwebtoken');
const User = require('./models/User'); // โมเดล User ของคุณ

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key'); // แทนที่ 'your_secret_key' ด้วย key ของคุณ
    const user = await User.findById(decoded.userId); // ค้นหาผู้ใช้ตาม userId ที่อยู่ใน token

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // เก็บข้อมูลผู้ใช้ไว้ใน request
    next(); // เรียก next เพื่อไปยังฟังก์ชันถัดไป
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
