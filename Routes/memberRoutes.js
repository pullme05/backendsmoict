const express = require('express');
const multer = require('multer');
const router = express.Router();
const Member = require('../models/Member');

// กำหนดที่เก็บไฟล์และชื่อไฟล์เมื่อทำการอัปโหลด
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // เก็บไฟล์ในโฟลเดอร์ 'uploads'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // ตั้งชื่อไฟล์เป็น timestamp + ชื่อไฟล์ต้นฉบับ
  }
});

// สร้าง instance ของ multer พร้อมการตั้งค่า storage
const upload = multer({ storage });

// GET all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new member พร้อมกับการอัปโหลดรูปภาพ
router.post('/', upload.single('avatar'), async (req, res) => {
  const { name, position, email, phoneNumber } = req.body;
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : ''; // เก็บ URL ของไฟล์ที่อัปโหลด
 // เก็บ path ของไฟล์รูปภาพที่อัปโหลด

  const newMember = new Member({
    name,
    position,
    email,
    avatarUrl, // เก็บ URL ของรูปที่อัปโหลด
    phoneNumber,
  });

  try {
    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT (update) a member พร้อมกับการอัปโหลดรูปภาพ
router.put('/:id', upload.single('avatar'), async (req, res) => {
  const { name, position, email, phoneNumber } = req.body;
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : req.body.avatarUrl;
 // ใช้ไฟล์ใหม่ถ้ามีการอัปโหลด

  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      {
        name,
        position,
        email,
        avatarUrl,
        phoneNumber,
      },
      { new: true }
    );
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a member
router.delete('/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
