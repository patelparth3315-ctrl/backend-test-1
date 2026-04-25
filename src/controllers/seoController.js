const SeoMeta = require('../models/SeoMeta');
const Trip = require('../models/Trip');
const Page = require('../models/Page');

// @desc    Get SEO meta for a page
// @route   GET /api/seo/:page
// @access  Public
exports.getSeo = async (req, res, next) => {
  try {
    const seo = await SeoMeta.findOne({ page: req.params.page });
    res.json({ success: true, data: seo });
  } catch (error) {
    next(error);
  }
};

// @desc    Update SEO meta for a page
// @route   PUT /api/seo/:page
// @access  Private/Admin
exports.updateSeo = async (req, res, next) => {
  try {
    const seo = await SeoMeta.findOneAndUpdate(
      { page: req.params.page },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: seo });
  } catch (error) {
    next(error);
  }
};

exports.getSitemap = async (req, res) => {
  try {
    const trips = await Trip.find({ status: 'published' }).select('slug updatedAt');
    const pages = await Page.find({ status: 'published' }).select('slug updatedAt');

    const baseUrl = process.env.FRONTEND_URL || 'https://youthcamping.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Home Page
    xml += `
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;

    // Static/CMS Pages
    pages.forEach(page => {
      xml += `
        <url>
          <loc>${baseUrl}/${page.slug}</loc>
          <lastmod>${page.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    // Trips
    trips.forEach(trip => {
      xml += `
        <url>
          <loc>${baseUrl}/trips/${trip.slug}</loc>
          <lastmod>${trip.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
};

exports.getRobots = async (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://youthcamping.com';
  const robots = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
  `.trim();

  res.header('Content-Type', 'text/plain');
  res.send(robots);
};
