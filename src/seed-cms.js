require('dotenv').config();
const mongoose = require('mongoose');
const Page = require('./models/Page');

const seedCMS = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for CMS Seeding...');

    const homePage = {
      title: 'Home Page',
      slug: 'home',
      status: 'published',
      isSystem: true,
      sections: [
        {
          id: 'vhero1',
          type: 'videohero',
          data: {
            title: 'YouthCamping',
            subtitle: 'Redefining Adventure Since 2021',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
          }
        },
        {
          id: 'banner1',
          type: 'banner',
          data: {
            title: 'Winter Trips',
            subtitle: 'Kashmir • Spiti Valley • Kasol Manali',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
          }
        },
        {
          id: 'trips1',
          type: 'trips',
          data: {
            title: 'Trending'
          }
        },
        {
          id: 'blogs1',
          type: 'blogs',
          data: {
            title: 'Watch & Read',
            count: 4
          }
        },
        {
          id: 'grid1',
          type: 'grid',
          data: {
            title: 'Our Packages',
            subtitle: 'Recommended Journeys',
            count: 6
          }
        }
      ]
    };

    // Update or create
    await Page.findOneAndUpdate({ slug: 'home' }, homePage, { upsert: true, new: true });
    
    console.log('CMS Seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedCMS();
