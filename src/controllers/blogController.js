const mongoose = require('mongoose');
const Blog = require('../models/Blog');

// @desc    Get all blogs
// @route   GET /api/blogs
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort('-createdAt');
    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id (can be ID or Slug)
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      $or: [
        mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : null,
        { slug: req.params.id }
      ].filter(Boolean)
    });

    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create blog
// @route   POST /api/blogs
exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
