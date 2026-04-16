const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    // Basic counts
    const totalTrips = await Trip.countDocuments();
    const activeTrips = await Trip.countDocuments({ isActive: true });
    
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: 'new' });

    // Revenue calculation (sum of totalAmount where status=confirmed)
    const revenueData = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Recent data
    const recentBookings = await Booking.find()
      .populate('tripId', 'title')
      .sort('-createdAt')
      .limit(5);

    const recentInquiries = await Inquiry.find()
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      data: {
        totalTrips,
        totalBookings,
        totalRevenue: revenue,
        totalInquiries,
        recentBookings: recentBookings.map(b => ({
          id: b._id,
          userName: b.userName || 'Guest',
          tripTitle: b.tripId ? b.tripId.title : 'Trip',
          amount: b.totalAmount || 0,
          status: b.status,
          createdAt: b.createdAt
        })),
        monthlyRevenue: [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: revenue }
        ],
        bookingsByStatus: [
          { status: 'Confirmed', count: confirmedBookings },
          { status: 'Pending', count: pendingBookings },
          { status: 'Cancelled', count: totalBookings - confirmedBookings - pendingBookings }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};
