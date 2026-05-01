const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');

// @desc    Get all quotations
// @route   GET /api/quotations
router.get('/', async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json({ success: true, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get single quotation by ID or Slug
// @route   GET /api/quotations/:idOrSlug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      $or: [{ id: req.params.idOrSlug }, { slug: req.params.idOrSlug }]
    });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Create or Update quotation
// @route   POST /api/quotations
router.post('/', async (req, res) => {
  try {
    const { id, slug, data, ...rest } = req.body;
    
    const quotationData = {
      id,
      slug,
      data,
      ...rest,
      updatedAt: Date.now()
    };

    const quotation = await Quotation.findOneAndUpdate(
      { id },
      quotationData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({ id: req.params.id });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
