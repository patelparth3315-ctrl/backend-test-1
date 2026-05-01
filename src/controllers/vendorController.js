const Vendor = require('../models/Vendor');
const TripVendor = require('../models/TripVendor');

// ─── VENDOR CRUD ────────────────────────────────────────────────

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private/Admin
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private/Admin
exports.getVendors = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.active !== undefined) query.isActive = req.query.active === 'true';

    const vendors = await Vendor.find(query).sort('name');
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private/Admin
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
exports.updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Remove all trip-vendor assignments for this vendor
    await TripVendor.deleteMany({ vendorId: req.params.id });
    await Vendor.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Vendor and all trip assignments removed' });
  } catch (error) {
    next(error);
  }
};

// ─── TRIP-VENDOR ASSIGNMENT ─────────────────────────────────────

// @desc    Assign vendor to trip
// @route   POST /api/vendors/trip-assign
// @access  Private/Admin
exports.assignVendorToTrip = async (req, res, next) => {
  try {
    const { tripId, vendorId, agreedCost, notes } = req.body;

    // Check if already assigned
    const existing = await TripVendor.findOne({ tripId, vendorId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This vendor is already assigned to this trip'
      });
    }

    const assignment = await TripVendor.create({
      tripId, vendorId, agreedCost, notes
    });

    const populated = await TripVendor.findById(assignment._id)
      .populate('vendorId', 'name type phone');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendors for a trip
// @route   GET /api/vendors/trip/:tripId
// @access  Private/Admin
exports.getVendorsForTrip = async (req, res, next) => {
  try {
    const assignments = await TripVendor.find({ tripId: req.params.tripId })
      .populate('vendorId', 'name type phone email location')
      .sort('createdAt');

    const totalVendorCost = assignments.reduce((sum, a) => sum + (a.agreedCost || 0), 0);
    const totalPaidToVendors = assignments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    res.json({
      success: true,
      data: assignments,
      summary: {
        totalVendorCost,
        totalPaidToVendors,
        pendingVendorPayments: totalVendorCost - totalPaidToVendors,
        count: assignments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip-vendor assignment (cost, payment status)
// @route   PUT /api/vendors/trip-assign/:id
// @access  Private/Admin
exports.updateTripVendor = async (req, res, next) => {
  try {
    const { agreedCost, paymentStatus, paidAmount, notes } = req.body;
    
    const assignment = await TripVendor.findByIdAndUpdate(
      req.params.id,
      { agreedCost, paymentStatus, paidAmount, notes },
      { new: true, runValidators: true }
    ).populate('vendorId', 'name type phone');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove vendor from trip
// @route   DELETE /api/vendors/trip-assign/:id
// @access  Private/Admin
exports.removeTripVendor = async (req, res, next) => {
  try {
    const assignment = await TripVendor.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await TripVendor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vendor removed from trip' });
  } catch (error) {
    next(error);
  }
};
