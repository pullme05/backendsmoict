const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User'); // นำเข้าโมเดล User
const authMiddleware = require('./authMiddleware');
const jwt = require('jsonwebtoken');

const app = express();
const cors = require('cors');
const port = 8000;

// ตั้งค่า URL ของ MongoDB
const mongoURI = 'mongodb+srv://admintest:123@cluster0.vf7nc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// ฟังก์ชันการเชื่อมต่อ
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); 
  }
};
connectDB();
// ใช้ middleware สำหรับแปลงข้อมูล request body เป็น JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cors({
  origin: 'http://localhost:5173' // เปลี่ยนเป็นโดเมนของคุณ
}));

// สร้าง endpoint สำหรับการล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    // ส่งข้อมูลผู้ใช้และ token กลับไป
    res.status(200).json({
      message: 'Login successful',
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        studentID: user.studentID,
        role: user.role
      },
      token // ส่ง token กลับไปด้วย
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// สร้าง endpoint สำหรับการสร้างผู้ใช้ทั่วไป
app.post('/createUser', async (req, res) => {
  const { username, password, firstName, lastName, studentID } = req.body;

  try {
    const newUser = new User({
      username,
      password,
      firstName,
      lastName,
      studentID,
      role: 'user' // ค่าเริ่มต้นเป็น user
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

// สร้าง endpoint สำหรับการสร้างผู้ใช้ admin
app.post('/createAdmin', async (req, res) => {
  const { username, password, firstName, lastName } = req.body;

  try {
    const newAdmin = new User({
      username,
      password,
      firstName,
      lastName,
      role: 'admin' // กำหนดบทบาทเป็น admin
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating admin', error: err.message });
  }
});

// สร้าง Schema สำหรับเก็บข้อมูลคีย์
const qrCodeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // คีย์ต้องไม่ซ้ำกัน
  used: { type: Boolean, default: false }, // ใช้ในการตรวจสอบว่าคีย์ถูกใช้หรือยัง
  timestamp: { type: Date, default: Date.now },
});
// สร้าง Model จาก Schema
const QRCode = mongoose.model('QRCode', qrCodeSchema);

// Endpoint สำหรับยืนยันคีย์
app.post('/api/verify-key', async (req, res) => {
  const { key } = req.body; // รับคีย์จาก request body

  try {
    // ค้นหาคีย์ในฐานข้อมูล
    const qrCode = await QRCode.findOne({ key });

    if (!qrCode) {
      // ถ้าคีย์ไม่พบในฐานข้อมูล
      return res.status(404).json({ message: 'Key not found.' });
    }

    if (qrCode.used) {
      // ถ้าคีย์ถูกใช้ไปแล้ว
      return res.status(400).json({ message: 'Key has already been used.' });
    }

    // ถ้าคีย์ยังไม่ถูกใช้
    qrCode.used = true; // อัปเดตสถานะว่าใช้คีย์แล้ว
    await qrCode.save(); // บันทึกข้อมูลในฐานข้อมูล

    return res.status(200).json({ message: 'Key is valid and marked as used.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});




// เพิ่ม routing สำหรับ ข่าวสาร
const newssRoutes = require('./Routes/NewssRoutes');
app.use('/api/news', newssRoutes);

// เพิ่ม routing สำหรับ ปฎิทินกิจกรรม
const EventRoutes = require('./Routes/Event');
app.use('/api/events', EventRoutes); 

// เพิ่ม routing สำหรับ การจองห้อง
const bookingRoutes = require('./Routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Routes
const memberRoutes = require('./Routes/memberRoutes');
app.use('/api/members', memberRoutes);

app.use('/uploads', express.static('uploads'));

// เพิ่ม route สำหรับดึงข้อมูลผู้ใช้ที่ล็อกอิน
app.get('/api/user', authMiddleware, (req, res) => {
  const { firstName, lastName, studentID } = req.user;
  
  // ตรวจสอบว่าข้อมูลถูกต้องหรือไม่
  if (!firstName || !lastName || !studentID) {
    return res.status(400).json({ message: 'User data is incomplete' });
  }

  res.status(200).json({
    firstName,
    lastName,
    studentID
  });
});




// เริ่มฟังที่พอร์ตที่กำหนด
app.listen(port, () => {
  console.log('HTTP server running at ' + port);
});
