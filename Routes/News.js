const express = require('express');
const router = express.Router();
const News = require('../models/News'); // นำเข้า News model

// Create a news entry
router.post('/', async (req, res) => {
  try {
    const newsEntry = new News(req.body);
    await newsEntry.save();
    res.status(201).send(newsEntry);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all news entries
router.get('/', async (req, res) => {
  try {
    const newsEntries = await News.find();
    res.send(newsEntries);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a news entry
router.put('/:id', async (req, res) => {
  try {
    const newsEntry = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!newsEntry) return res.status(404).send();
    res.send(newsEntry);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a news entry
router.delete('/:id', async (req, res) => {
  try {
    const newsEntry = await News.findByIdAndDelete(req.params.id);
    if (!newsEntry) return res.status(404).send();
    res.send(newsEntry);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router; // ส่งออก router
