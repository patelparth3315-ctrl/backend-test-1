require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');

const reviews = [
    {
      userName: "Bhumit Rabadiya",
      tripName: "Thailand Trip",
      comment: "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference!",
      rating: 5,
      isFeatured: true,
      userImage: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80"
    },
    {
      userName: "Janak Chauhan",
      tripName: "Spiti Valley",
      comment: "Just few weeks back I took the trip to Spiti Valley with Avian Experiences and believe me I had an amazing expedition of lifetime.",
      rating: 5,
      isFeatured: true,
      userImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80"
    },
    {
      userName: "Utsav Nathvani",
      tripName: "Ladakh Expedition",
      comment: "It won't be wrong to say avian experiences is synonymous with great adventures. And it also won't be wrong to say that you can...",
      rating: 5,
      isFeatured: true,
      userImage: "https://images.unsplash.com/photo-1544621245-09893d567909?auto=format&fit=crop&q=80"
    },
    {
      userName: "Deep Bhansali",
      tripName: "Spiti Valley",
      comment: "Spiti valley trip : Best experience, good facilities, group leader (Mayur vora) is also friendly and best service by Avian Experience.",
      rating: 5,
      isFeatured: true,
      userImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80"
    },
    {
      userName: "Krima Pandya",
      tripName: "Ladakh Tour",
      comment: "Highly Recommended for tour booking. Everything was smoothly organized by Mr. SAGAR BUTANI. We had a great time in Ladakh.",
      rating: 5,
      isFeatured: true,
      userImage: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80"
    }
];

const seedReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Review Seeding...');

    await Review.deleteMany();
    await Review.insertMany(reviews);
    console.log('Testimonials Seeded Successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedReviews();
