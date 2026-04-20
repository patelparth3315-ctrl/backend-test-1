const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();

    // 1. Total Revenue (Confirmed Bookings + Converted Inquiries)
    const bookingRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const inquiryRevenue = await Inquiry.aggregate([
      { $match: { status: 'converted' } },
      { $group: { _id: null, total: { $sum: '$convertedAmount' } } }
    ]);

    const totalRevenue = (bookingRevenue[0]?.total || 0) + (inquiryRevenue[0]?.total || 0);

    // 2. Recent Bookings
    const recentBookings = await Booking.find()
      .populate('tripId', 'title')
      .sort('-createdAt')
      .limit(5);

    // 3. Dynamic Monthly Revenue (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyData = await Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const match = monthlyData.find(m => m._id.month === (monthIndex + 1) && m._id.year === year);
      monthlyRevenue.push({
        month: monthNames[monthIndex],
        revenue: match ? match.revenue : 0
      });
    }

    // 4. Booking Status Distribution
    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bookingsByStatus = statusCounts.map(s => ({
      status: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      count: s.count
    }));

    res.json({
      success: true,
      data: {
        totalTrips,
        totalBookings,
        totalRevenue,
        totalInquiries,
        recentBookings: recentBookings.map(b => ({
          id: b._id,
          userName: b.userName || 'Guest',
          tripTitle: b.tripId ? b.tripId.title : 'Trip',
          amount: b.totalAmount || 0,
          status: b.status,
          createdAt: b.createdAt
        })),
        monthlyRevenue,
        bookingsByStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
