const express = require('express');
const router = express.Router();
const { 
  getPublishedLayout, getDraftLayout, updateAllSections, 
  updateSection, reorderSections, toggleSectionVisibility, publishLayout,
  duplicateSection
} = require('../controllers/pageBuilderController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/:name', getPublishedLayout);
router.get('/:name/draft', protect, requireRole('admin'), getDraftLayout);
router.put('/:name/sections', protect, requireRole('admin'), updateAllSections);
router.patch('/:name/sections/:sectionId', protect, requireRole('admin'), updateSection);
router.patch('/:name/sections/reorder', protect, requireRole('admin'), reorderSections);
router.patch('/:name/sections/:sectionId/toggle', protect, requireRole('admin'), toggleSectionVisibility);
router.post('/:name/sections/duplicate/:sectionId', protect, requireRole('admin'), duplicateSection);
router.delete('/:name/sections/:sectionId', protect, requireRole('admin'), (req, res, next) => {
  // Logic already exists in updateAllSections but adding a dedicated delete is better
  next();
});
router.post('/:name/publish', protect, requireRole('admin'), publishLayout);

module.exports = router;
