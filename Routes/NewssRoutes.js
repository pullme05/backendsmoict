const express = require('express');
const router = express.Router();
const News = require('../models/Newss');

// สร้างข่าวใหม่
router.post('/', async (req, res) => {
  try {
    const news = new News(req.body);
    await news.save();
    res.status(201).json(news);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ดึงข้อมูลข่าวทั้งหมด
router.get('/', async (req, res) => {
  try {
    const news = await News.find();
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// แก้ไขข่าว
router.put('/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(news);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ลบข่าว
router.delete('/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'ข่าวถูกลบแล้ว' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
