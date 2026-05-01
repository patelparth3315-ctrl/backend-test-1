const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');
const Payment = require('../models/Payment');
const TripVendor = require('../models/TripVendor');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res, next) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();

    // 1. Total Revenue from ACTUAL payments (not just confirmed bookings)
    const paymentRevenue = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Fallback: also count confirmed booking revenue for backward compat
    const bookingRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const inquiryRevenue = await Inquiry.aggregate([
      { $match: { status: 'converted' } },
      { $group: { _id: null, total: { $sum: '$convertedAmount' } } }
    ]);

    // Use actual payments if available, otherwise fall back to booking-based revenue
    const actualPaymentsTotal = paymentRevenue[0]?.total || 0;
    const legacyRevenue = (bookingRevenue[0]?.total || 0) + (inquiryRevenue[0]?.total || 0);
    const totalRevenue = actualPaymentsTotal > 0 ? actualPaymentsTotal : legacyRevenue;

    // 2. Pending Payments (total booking amounts - total payments received)
    const totalBookingValue = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const pendingPayments = (totalBookingValue[0]?.total || 0) - actualPaymentsTotal;

    // 3. Total Vendor Costs
    const vendorCosts = await TripVendor.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$agreedCost' }, totalPaid: { $sum: '$paidAmount' } } }
    ]);
    const totalVendorCost = vendorCosts[0]?.totalCost || 0;
    const totalVendorPaid = vendorCosts[0]?.totalPaid || 0;

    // 4. Profit Calculation
    const totalProfit = totalRevenue - totalVendorCost;

    // 5. Recent Bookings
    const recentBookings = await Booking.find()
      .populate('tripId', 'title')
      .sort('-createdAt')
      .limit(5);

    // 6. Dynamic Monthly Revenue (Last 6 months) — from payments
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyData = await Payment.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$paymentDate' }, year: { $year: '$paymentDate' } },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fallback to booking-based monthly data if no payments exist yet
    let monthlySourceData = monthlyData;
    if (monthlyData.length === 0) {
      monthlySourceData = await Booking.aggregate([
        { $match: { status: 'confirmed', createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenue = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const match = monthlySourceData.find(m => m._id.month === (monthIndex + 1) && m._id.year === year);
      monthlyRevenue.push({
        month: monthNames[monthIndex],
        revenue: match ? match.revenue : 0
      });
    }

    // 7. Booking Status Distribution
    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const bookingsByStatus = statusCounts.map(s => ({
      status: s._id.charAt(0).toUpperCase() + s._id.slice(1),
      count: s.count
    }));

    // 8. Upcoming Trips (trips with future available dates)
    const upcomingTrips = await Trip.find({
      status: 'published',
      'availableDates.date': { $gte: new Date() }
    }).select('title location duration availableDates').limit(5).sort('availableDates.date');

    res.json({
      success: true,
      data: {
        totalTrips,
        totalBookings,
        totalRevenue,
        totalInquiries,
        pendingPayments: Math.max(0, pendingPayments),
        totalVendorCost,
        totalVendorPaid,
        pendingVendorPayments: totalVendorCost - totalVendorPaid,
        totalProfit,
        upcomingTrips: upcomingTrips.map(t => ({
          id: t._id,
          title: t.title,
          location: t.location,
          duration: t.duration,
          nextDate: t.availableDates?.find(d => new Date(d.date) >= new Date())?.date
        })),
        recentBookings: recentBookings.map(b => ({
          id: b._id,
          userName: b.userName || 'Guest',
          tripTitle: b.tripId ? b.tripId.title : 'Trip',
          amount: b.totalAmount || 0,
          paidAmount: b.paidAmount || 0,
          status: b.status,
          paymentStatus: b.paymentStatus,
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
