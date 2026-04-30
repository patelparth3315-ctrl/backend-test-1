const Attraction = require('../models/Attraction');

exports.getAttractions = async (req, res) => {
  try {
    const attractions = await Attraction.find().sort({ order: 1, name: 1 });
    res.status(200).json(attractions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttractionBySlug = async (req, res) => {
  try {
    const attraction = await Attraction.findOne({ slug: req.params.slug });
    if (!attraction) {
      return res.status(404).json({ message: 'Attraction not found' });
    }
    res.status(200).json(attraction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAttraction = async (req, res) => {
  try {
    const attraction = new Attraction(req.body);
    await attraction.save();
    res.status(201).json(attraction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(attraction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAttraction = async (req, res) => {
  try {
    await Attraction.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Attraction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
