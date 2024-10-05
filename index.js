const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User'); // นำเข้าโมเดล User
const NewsRoutes = require('./Routes/News'); // นำเข้า News routes


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
app.use(express.json());
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

    res.status(200).json({
      message: 'Login successful',
      user: {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        studentID: user.studentID,
        role: user.role // ส่ง role กลับไปด้วย
      }
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

// เพิ่ม routing สำหรับข่าวสาร
app.use('/api/news', NewsRoutes); 
// เพิ่ม routing สำหรับ ปฎิทินกิจกรรม
const EventRoutes = require('./Routes/Event');
app.use('/api/events', EventRoutes); 

// เพิ่ม routing สำหรับ การจองห้อง
const bookingRoutes = require('./Routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);


// เริ่มฟังที่พอร์ตที่กำหนด
app.listen(port, () => {
  console.log('HTTP server running at ' + port);
});
