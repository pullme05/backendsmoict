const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
// สร้างการจอง
router.post('/create', async (req, res) => {
  const { room, studentName, studentID, phoneNumber, startTime, endTime, purpose, date } = req.body; // เพิ่ม phoneNumber เข้ามาใน request body

  try {
    const newBooking = new Booking({
      room,
      studentName,
      studentID,
      phoneNumber,  // เพิ่ม phoneNumber ในการสร้าง booking
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


// ลบการจองตาม studentID
router.delete('/delete/:studentID', async (req, res) => {
  const { studentID } = req.params;

  try {
    const deletedBooking = await Booking.findOneAndDelete({ studentID });

    if (!deletedBooking) {
      return res.status(404).json({ message: 'ไม่พบการจองนี้' });
    }

    res.status(200).json({ message: 'ยกเลิกการจองสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบการจอง', error: err.message });
  }
});


// อนุมัติการจอง
router.post('/approve/:studentID', async (req, res) => {
  const { studentID } = req.params;

  try {
    const booking = await Booking.findOne({ studentID });

    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองนี้' });
    }

    booking.status = 'อนุมัติแล้ว';
    await booking.save();

    res.status(200).json({ message: 'อนุมัติการจองสำเร็จ', booking });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติการจอง' });
  }
});

// ปฏิเสธการจอง (ไม่ต้องการ reason)
router.post('/reject/:studentID', async (req, res) => {
  const { studentID } = req.params;

  try {
    // ตรวจสอบว่าค่าของ studentID ส่งมาถูกต้องหรือไม่
    console.log('Rejecting booking for studentID:', studentID);

    // ค้นหาการจองจาก studentID
    const booking = await Booking.findOne({ studentID });

    // ถ้าไม่พบการจอง
    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการจองนี้' });
    }

    // อัปเดตสถานะเป็น 'ถูกปฏิเสธ'
    booking.status = 'ถูกปฏิเสธ';
    await booking.save();

    // ส่งผลลัพธ์กลับ
    res.status(200).json({ message: 'ปฏิเสธการจองสำเร็จ', booking });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปฏิเสธการจอง', error: error.message });
  }
});

// PUT endpoint สำหรับการแก้ไขข้อมูลการจองโดยใช้ studentID
router.put('/bookings/update/:studentID', async (req, res) => {
  const studentID = req.params.studentID;
  console.log('Student ID from request:', studentID);  // Debugging

  try {
    // ตรวจสอบว่า studentID ถูกส่งมาหรือไม่
    if (!studentID) {
      return res.status(400).json({ message: 'Student ID ที่ส่งมาไม่ถูกต้อง' });
    }

    // ตรวจสอบว่า studentID มีอยู่จริงในฐานข้อมูลหรือไม่ (กรณีที่เป็น string)
    const booking = await Booking.findOneAndUpdate(
      { studentID: studentID.toString() },  // ค้นหาด้วย studentID โดยเปลี่ยนเป็น string (กรณีฐานข้อมูลเป็น string)
      req.body,  // ข้อมูลที่ต้องการอัปเดต
      { new: true, runValidators: true }  // คืนค่าการจองใหม่ที่อัปเดต
    );

    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบการจองที่มี Student ID นี้' });
    }

    res.status(200).json({
      message: 'แก้ไขการจองสำเร็จ',
      booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขการจอง' });
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

// ดึงการจองที่สถานะ 'รอการอนุมัติจากผู้ดูแล'
router.get('/pending', async (req, res) => {
  try {
    const pendingBookings = await Booking.find({ status: 'รอการอนุมัติจากผู้ดูแล' });
    res.status(200).json(pendingBookings);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองที่รอการอนุมัติ', error: err.message });
  }
});

// ยกเลิกการจองด้วยรหัสนิสิตและหมายเลขโทรศัพท์
router.post('/cancel', async (req, res) => {
  const { studentID, phoneNumber } = req.body;

  try {
    const booking = await Booking.findOne({ studentID, phoneNumber, status: 'รอการอนุมัติจากผู้ดูแล' });

    if (!booking) {
      return res.status(404).json({ message: 'ไม่พบการจองที่ตรงกับข้อมูลที่ระบุ หรือการจองนี้ได้รับการอนุมัติแล้ว' });
    }

    await Booking.findByIdAndDelete(booking._id);

    res.status(200).json({ message: 'ยกเลิกการจองสำเร็จ' });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง', error: err.message });
  }
});


module.exports = router;
