const PageLayout = require('../models/PageLayout');

// @desc    Get published layout
// @route   GET /api/page-builder/:name
// @access  Public
exports.getPublishedLayout = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) {
      return res.json({ success: true, data: { name: req.params.name, sections: [], publishedAt: null } });
    }
    // Return only visible sections and published content
    const publishedSections = layout.sections
      .filter(s => s.visible)
      .map(s => ({
        id: s.id,
        type: s.type,
        order: s.order,
        content: s.content
      }))
      .sort((a, b) => a.order - b.order);

    res.json({ success: true, data: { name: layout.name, sections: publishedSections, publishedAt: layout.publishedAt } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get draft layout
// @route   GET /api/page-builder/:name/draft
// @access  Private/Admin
exports.getDraftLayout = async (req, res, next) => {
  try {
    let layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) {
      layout = await PageLayout.create({ 
        name: req.params.name, 
        sections: [], 
        isDraft: true 
      });
    }
    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Replace all sections
// @route   PUT /api/page-builder/:name/sections
// @access  Private/Admin
exports.updateAllSections = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOneAndUpdate(
      { name: req.params.name },
      { sections: req.body.sections, isDraft: true },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Update one section content
// @route   PATCH /api/page-builder/:name/sections/:sectionId
// @access  Private/Admin
exports.updateSection = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    const section = layout.sections.find(s => s.id === req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

    section.draft = req.body.content;
    layout.isDraft = true;
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder sections
// @route   PATCH /api/page-builder/:name/sections/reorder
// @access  Private/Admin
exports.reorderSections = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    const { orders } = req.body; // [{id, order}]
    orders.forEach(o => {
      const section = layout.sections.find(s => s.id === o.id);
      if (section) section.order = o.order;
    });

    layout.isDraft = true;
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle visible
// @route   PATCH /api/page-builder/:name/sections/:sectionId/toggle
// @access  Private/Admin
exports.toggleSectionVisibility = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    const section = layout.sections.find(s => s.id === req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

    section.visible = !section.visible;
    layout.isDraft = true;
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish draft
// @route   POST /api/page-builder/:name/publish
// @access  Private/Admin
exports.publishLayout = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    layout.sections.forEach(s => {
      if (s.draft) s.content = s.draft;
    });
    layout.isDraft = false;
    layout.publishedAt = new Date();
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate section
// @route   POST /api/page-builder/:name/sections/duplicate/:sectionId
// @access  Private/Admin
exports.duplicateSection = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    const sectionIndex = layout.sections.findIndex(s => s.id === req.params.sectionId);
    if (sectionIndex === -1) return res.status(404).json({ success: false, message: 'Section not found' });

    const original = layout.sections[sectionIndex];
    const duplicate = {
      ...original.toObject(),
      id: require('crypto').randomUUID(),
      name: `${original.name || original.type} (Copy)`,
      order: original.order + 1
    };

    // Bump orders of subsequent sections
    layout.sections.forEach(s => {
      if (s.order > original.order) s.order += 1;
    });

    layout.sections.splice(sectionIndex + 1, 0, duplicate);
    layout.isDraft = true;
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete section
// @route   DELETE /api/page-builder/:name/sections/:sectionId
// @access  Private/Admin
exports.deleteSection = async (req, res, next) => {
  try {
    const layout = await PageLayout.findOne({ name: req.params.name });
    if (!layout) return res.status(404).json({ success: false, message: 'Layout not found' });

    layout.sections = layout.sections.filter(s => s.id !== req.params.sectionId);
    layout.isDraft = true;
    await layout.save();

    res.json({ success: true, data: layout });
  } catch (error) {
    next(error);
  }
};
