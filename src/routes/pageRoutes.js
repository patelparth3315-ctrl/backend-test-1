const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

// Get all pages
router.get('/', async (req, res) => {
  try {
    const pages = await Page.find().sort('-updatedAt');
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single page by ID or Slug
router.get('/:id', async (req, res) => {
  try {
    // Try slug first (most common for frontend requests like /pages/home)
    let page = await Page.findOne({ slug: req.params.id });
    
    // If not found by slug, try as ObjectId (for admin panel edit links)
    if (!page) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        page = await Page.findById(req.params.id);
      }
    }
    
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create page
router.post('/', async (req, res) => {
  try {
    const page = await Page.create(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update page
router.put('/:id', async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete page
router.delete('/:id', async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Publish page (Move draft to live)
router.post('/:id/publish', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    page.sections = [...page.draftSections];
    page.status = 'published';
    page.lastPublishedAt = new Date();
    
    await page.save();
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
