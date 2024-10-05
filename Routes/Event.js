const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// GET: ดึงข้อมูลกิจกรรมทั้งหมด
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// POST: เพิ่มกิจกรรมใหม่
router.post('/', async (req, res) => {
  const { title, start, end, details } = req.body;

  try {
    const newEvent = new Event({
      title,
      start,
      end,
      details,
    });
    
    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// DELETE: ลบกิจกรรม
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

module.exports = router;
