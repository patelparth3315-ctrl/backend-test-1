const requireRole = (role) => (req, res, next) => {
  const user = req.admin || req.user;
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  // Superadmin bypasses everything
  if (user.role === 'superadmin') return next();

  if (user.role !== role && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
};

module.exports = requireRole;
