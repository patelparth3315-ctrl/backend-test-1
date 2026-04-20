const Inquiry = require('../models/Inquiry');

// @desc    Submit inquiry
// @route   POST /api/inquiries
// @access  Public
exports.createInquiry = async (req, res, next) => {
  try {
    const { phone, tripId } = req.body;
    
    // CRM: Check for duplicates in the last 48 hours
    const duplicate = await Inquiry.findOne({
      phone,
      tripId,
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    });

    const inquiry = await Inquiry.create({
      ...req.body,
      isDuplicate: !!duplicate
    });

    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private/Admin
exports.getInquiries = async (req, res, next) => {
  try {
    console.log('Admin fetching inquiries...');
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100; // Increased limit for admin
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const inquiries = await Inquiry.find(query)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Inquiry.countDocuments(query);
    console.log(`Found ${inquiries.length} inquiries. Total: ${total}`);

    res.json({
      success: true,
      count: inquiries.length,
      total,
      data: inquiries.map(inq => ({
        id: inq._id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        message: inq.message,
        tripTitle: inq.tripTitle,
        date: inq.date,
        count: inq.count,
        status: inq.status,
        read: inq.status !== 'new',
        createdAt: inq.createdAt,
        isDuplicate: inq.isDuplicate,
        convertedAmount: inq.convertedAmount,
        adminNotes: inq.adminNotes,
        responseTimeMinutes: inq.responseTimeMinutes
      }))
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error.message);
    next(error);
  }
};

// @desc    Get single inquiry
// @route   GET /api/inquiries/:id
// @access  Private/Admin
exports.getInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status/notes
// @route   PATCH /api/inquiries/:id/status
// @access  Private/Admin
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, convertedAmount, nextFollowUp } = req.body;
    let inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    const updateData = {};
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp;
    if (convertedAmount !== undefined) updateData.convertedAmount = convertedAmount;
    
    // CRM: Track first response time
    if (inquiry.status === 'new' && status === 'contacted') {
      updateData.firstRespondedAt = new Date();
      updateData.responseTimeMinutes = Math.round((updateData.firstRespondedAt - inquiry.createdAt) / 60000);
    }

    if (status) updateData.status = status;

    inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private/Admin
exports.deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Inquiry removed' });
  } catch (error) {
    next(error);
  }
};
