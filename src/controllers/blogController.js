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
    console.log("🚀 CREATE BLOG REQ BODY:", JSON.stringify(req.body, null, 2));
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    console.error("🚨 CREATE BLOG ERROR:", err.message);
    
    // Handle Duplicate Key Error (Slug)
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "A blog with this title or slug already exists. Please choose a unique title." 
      });
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: messages
      });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
  try {
    console.log("🚀 UPDATE BLOG REQ BODY:", JSON.stringify(req.body, null, 2));
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!blog) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    console.error("🚨 UPDATE BLOG ERROR:", err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: messages,
        receivedData: req.body 
      });
    }
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
