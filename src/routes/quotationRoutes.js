const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const { protect } = require('../middleware/auth');

// @desc    Get all quotations
// @route   GET /api/quotations
router.get('/', protect, async (req, res) => {
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
    const query = {
      $or: [
        { id: req.params.idOrSlug },
        { slug: req.params.idOrSlug }
      ]
    };
    
    if (mongoose.Types.ObjectId.isValid(req.params.idOrSlug)) {
      query.$or.push({ _id: req.params.idOrSlug });
    }

    const quotation = await Quotation.findOne(query);
    
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // SaaS Rule: Expiry Logic
    if (quotation.expiresAt && new Date() > quotation.expiresAt && !req.query.isAdmin) {
      return res.json({ 
        success: true, 
        data: { 
          expired: true, 
          tripTitle: quotation.tripTitle,
          customerName: quotation.customerName,
          expert: quotation.expert
        } 
      });
    }

    // SaaS Rule: Draft quotes should NOT be publicly visible
    if (quotation.status === 'Draft' && !req.query.isAdmin) {
      return res.status(404).json({ success: false, message: 'Quotation is not published yet' });
    }

    // Increment view count if not admin
    if (!req.query.isAdmin) {
      quotation.viewCount = (quotation.viewCount || 0) + 1;
      await quotation.save();
    }

    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Create or Update quotation
// @route   POST /api/quotations
router.post('/', protect, async (req, res) => {
  try {
    const { id, status, ...rest } = req.body;
    
    // Ensure slug exists
    if (!rest.slug) {
      rest.slug = Math.random().toString(36).substring(2, 7);
    }

    const quotationData = {
      ...rest,
      status,
      updatedAt: Date.now()
    };

    // SaaS Rule: Expiry Logic on Publish
    if (status === 'Published' && quotationData.expiryHours) {
      quotationData.publishedAt = Date.now();
      quotationData.expiresAt = new Date(Date.now() + quotationData.expiryHours * 60 * 60 * 1000);
    }

    const quotation = await Quotation.findOneAndUpdate(
      { id },
      quotationData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, error: err });
  }
});

// @desc    Extend quotation expiry
// @route   PATCH /api/quotations/:id/extend
router.patch('/:id/extend', protect, async (req, res) => {
  try {
    const { hours = 48 } = req.body;
    const quotation = await Quotation.findOne({ id: req.params.id });
    
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const currentExpiry = quotation.expiresAt || new Date();
    quotation.expiresAt = new Date(currentExpiry.getTime() + hours * 60 * 60 * 1000);
    await quotation.save();

    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
router.delete('/:id', protect, async (req, res) => {
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
