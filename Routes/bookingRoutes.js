const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// สร้างการจอง
router.post('/create', async (req, res) => {
  const { room, studentName, studentID, startTime, endTime, purpose, date } = req.body;

  try {
    const newBooking = new Booking({
      room,
      studentName,
      studentID,
      startTime,
      endTime,
      purpose,
      date,
    });

    await newBooking.save();
    res.status(201).json({ message: 'การจองถูกสร้างสำเร็จ', booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างการจอง', error: err.message });
  }
});

// ดึงการจองทั้งหมด
router.get('/', async (req, res) => {
    try {
      const bookings = await Booking.find();
      
      // Log ข้อมูล bookings เพื่อดูว่ามันเป็น array หรือไม่
      console.log("bookings: ", bookings);
  
      // ตรวจสอบว่า bookings เป็น array หรือไม่ ถ้าไม่ใช่ก็ส่ง array เปล่ากลับไป
      if (!Array.isArray(bookings)) {
        return res.status(200).json([]);
      }
      
      res.status(200).json(bookings);
    } catch (err) {
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง', error: err.message });
    }
  });
  

// ตรวจสอบความพร้อมของการจอง
router.post('/checkAvailability', async (req, res) => {
  const { room, date, startTime, endTime } = req.body;

  try {
    const existingBookings = await Booking.find({
      room,
      date: new Date(date),
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'เวลาและห้องที่เลือกมีการจองอยู่แล้ว' });
    }

    res.status(200).json({ message: 'สามารถจองได้' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ', error: err.message });
  }
});

// ดึงการจองที่สถานะ 'รอการอนุมัติจากผู้ดูแล'
router.get('/pending', async (req, res) => {
  try {
    const pendingBookings = await Booking.find({ status: 'รอการอนุมัติจากผู้ดูแล' });
    res.status(200).json(pendingBookings);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง', error: err.message });
  }
});

// ลบการจอง
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'รูปแบบ ID ไม่ถูกต้อง' });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบการจองที่ระบุ' });
    }

    // ตรวจสอบว่า status ยังไม่ได้รับการอนุมัติ
    if (booking.status !== 'รอการอนุมัติจากผู้ดูแล') {
      return res.status(400).json({ message: 'ไม่สามารถยกเลิกการจองที่ได้รับการอนุมัติแล้วได้' });
    }

    await Booking.findByIdAndDelete(id);
    res.status(200).json({ message: 'การจองถูกลบสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบการจอง', error: err.message });
  }
});

// อนุมัติการจอง
router.post('/approve/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // ค้นหาการจองด้วย ID ที่ได้รับมา
    const booking = await Booking.findById(id);

    // ถ้าหาไม่เจอ ให้ส่งสถานะ 404
    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองนี้' });
    }

    // อัปเดตสถานะการจองเป็น "อนุมัติแล้ว"
    booking.status = 'อนุมัติแล้ว';
    await booking.save();

    // ส่งตอบกลับสำเร็จ
    res.status(200).json({ message: 'อนุมัติการจองสำเร็จ', booking });
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาด ให้ส่งสถานะ 500 พร้อมกับข้อความแสดงข้อผิดพลาด
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติการจอง' });
  }
});

// ปฏิเสธการจอง
router.post('/reject/:id', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // รับเหตุผลจากการปฏิเสธที่ถูกส่งมาใน body

  try {
    // ค้นหาการจองด้วย ID ที่ได้รับมา
    const booking = await Booking.findById(id);

    // ถ้าหาไม่เจอ ให้ส่งสถานะ 404
    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองนี้' });
    }

    // อัปเดตสถานะการจองเป็น "ถูกปฏิเสธ" พร้อมกับเหตุผลการปฏิเสธ
    booking.status = 'ถูกปฏิเสธ';
    booking.rejectionReason = reason;
    await booking.save();

    // ส่งตอบกลับสำเร็จ
    res.status(200).json({ message: 'ปฏิเสธการจองสำเร็จ', booking });
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาด ให้ส่งสถานะ 500 พร้อมกับข้อความแสดงข้อผิดพลาด
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปฏิเสธการจอง' });
  }
});
// ดึงการจองที่สถานะ 'อนุมัติแล้ว'
router.get('/approved', async (req, res) => {
  try {
    const approvedBookings = await Booking.find({ status: 'อนุมัติแล้ว' });
    res.status(200).json(approvedBookings);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองที่อนุมัติแล้ว', error: err.message });
  }
});
// ดึงการจองที่สถานะ 'ถูกปฏิเสธ'
router.get('/rejected', async (req, res) => {
  try {
    const rejectedBookings = await Booking.find({ status: 'ถูกปฏิเสธ' });
    res.status(200).json(rejectedBookings);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองที่ถูกปฏิเสธ', error: err.message });
  }
});



module.exports = router;


