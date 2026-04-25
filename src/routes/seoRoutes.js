const express = require('express');
const router = express.Router();
const { getSeo, updateSeo, getSitemap, getRobots } = require('../controllers/seoController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobots);

router.get('/:page', getSeo);
router.put('/:page', protect, requireRole('admin'), updateSeo);

module.exports = router;
