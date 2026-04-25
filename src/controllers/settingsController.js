const GlobalSettings = require('../models/GlobalSettings');

// @desc    Get published settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({
        logo: { url: '', alt: 'YouthCamping' },
        navbarLinks: [],
        footer: { tagline: 'Adventure Awaits', copyright: '© 2026 YouthCamping' },
        social: {},
        contact: {}
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSettings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get draft settings (placeholder for now as the model doesn't explicitly have draft fields yet, but matching requested route)
// @route   GET /api/settings/draft
// @access  Private/Admin
exports.getDraftSettings = async (req, res, next) => {
  try {
    const settings = await GlobalSettings.findOne();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};
