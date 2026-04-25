const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('./src/models/Trip');

const TRIPS = [
  {
    title: "Kerala Group Trip 2026",
    slug: "kerala-group-trip-2026",
    description: "Backwaters • Waterfalls • Beaches • Hills. Experience the 'God's Own Country' with our curated 7-day journey.",
    location: "Kerala",
    price: 19799,
    duration: "7 Days / 6 Nights",
    category: "Backpacking",
    difficulty: "easy",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800"
    ],
    availableDates: [
      { date: "2026-06-01", capacity: 20 }, { date: "2026-07-05", capacity: 20 }, { date: "2026-08-05", capacity: 20 }
    ],
    variants: [
      { location: "Triple Sharing", originalPrice: 24999, discountedPrice: 19799 },
      { location: "Double Sharing", originalPrice: 28999, discountedPrice: 22999 }
    ]
  },
  {
    title: "Spiti Valley Road Trip (From Ahmedabad)",
    slug: "spiti-valley-road-trip-ahmedabad",
    description: "Desert Mountains • Chandratal • High Altitude Adventure. A full circuit journey from Ahmedabad via Chandigarh and Manali to the heart of Spiti.",
    location: "Spiti Valley",
    price: 24999,
    duration: "11 Days / 10 Nights",
    category: "Road Trip",
    difficulty: "hard",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Chandigarh", icon: "car" },
      { label: "Manali", icon: "car" },
      { label: "Kaza", icon: "car" },
      { label: "Chandratal", icon: "car" },
      { label: "Manali", icon: "car" }
    ],
    highlights: [
      "Kunzum Pass (15,000 ft)",
      "Key Monastery Exploration",
      "Hikkim - Highest Post Office",
      "Langza - Fossil Village",
      "Chandratal Lake Camping"
    ],
    inclusions: [
      "Train journey from Ahmedabad (if selected)",
      "All transfers in AC/Local Vehicles",
      "Stay in Hotels, Camps & Homestays",
      "Breakfast + Dinner included",
      "Trip Captain support"
    ],
    exclusions: [
      "Lunch & Personal expenses",
      "Entry fees to monasteries",
      "Adventure activities"
    ],
    itinerary: [
      { day: 1, title: "Ahmedabad → Chandigarh", description: "Start your journey from Ahmedabad by train. Meet your fellow travelers." },
      { day: 3, title: "Chandigarh → Manali", description: "Scenic mountain drive to Manali. Overnight stay." },
      { day: 4, title: "Manali Local", description: "Acclimatization day. Visit Solang Valley and Atal Tunnel." },
      { day: 5, title: "Manali → Kaza", description: "Enter Spiti Valley via Kunzum Pass. High altitude drive." },
      { day: 6, title: "Kaza Sightseeing", description: "Visit Key Monastery, Hikkim, and Langza." },
      { day: 8, title: "Kaza → Chandratal", description: "Experience the magical Chandratal Lake. Overnight camping." }
    ],
    availableDates: [
      { date: "2026-05-15", capacity: 15 }, { date: "2026-06-15", capacity: 15 }, { date: "2026-07-15", capacity: 15 }
    ],
    variants: [
      { location: "With Train (Ahmedabad)", originalPrice: 34999, discountedPrice: 24999 },
      { location: "Without Train (Chandigarh)", originalPrice: 26999, discountedPrice: 18999 }
    ]
  },
  {
    title: "Bhrigu Lake Trek with Manali, Kasol & Amritsar",
    slug: "bhrigu-lake-trek-manali-kasol-amritsar",
    description: "Trek • Mountains • Riverside • Culture. A 10-day journey combining high-altitude trekking with the spiritual vibes of Amritsar.",
    location: "Himachal & Punjab",
    price: 14999,
    duration: "10 Days / 9 Nights",
    category: "Trekking",
    difficulty: "moderate",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Manali", icon: "car" },
      { label: "Bhrigu Lake", icon: "hiking" },
      { label: "Kasol", icon: "car" },
      { label: "Amritsar", icon: "car" }
    ],
    highlights: [
      "Bhrigu Lake Trek (14,000 ft)",
      "Riverside camping in Kasol",
      "Golden Temple & Wagah Border",
      "Atal Tunnel experience"
    ],
    inclusions: [
      "Travel as per selected package",
      "Trek permits and Camping gear",
      "Stay in Hotels & Camps",
      "Meals during the trek",
      "Expert Trip Leader"
    ],
    itinerary: [
      { day: 1, title: "Ahmedabad → Delhi", description: "Start the journey via train." },
      { day: 4, title: "Manali Exploration", description: "Visit Hadimba Temple and Mall Road." },
      { day: 5, title: "Trek to Base Camp", description: "Drive to Gulaba and begin the trek." },
      { day: 6, title: "Bhrigu Lake Summit", description: "Reach the mystical Bhrigu Lake at 14,000 ft." },
      { day: 7, title: "Manali → Kasol", description: "Riverside relaxation in Kasol." },
      { day: 9, title: "Amritsar Sightseeing", description: "Golden Temple and Wagah Border visit." }
    ],
    availableDates: [
      { date: "2026-05-10", capacity: 25 }, { date: "2026-06-10", capacity: 25 }, { date: "2026-07-10", capacity: 25 }
    ],
    variants: [
      { location: "With Ahmedabad Train", originalPrice: 22999, discountedPrice: 16999 },
      { location: "Join from Delhi", originalPrice: 19999, discountedPrice: 14999 }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const trip of TRIPS) {
      await Trip.findOneAndUpdate(
        { slug: trip.slug },
        trip,
        { upsert: true, new: true }
      );
      console.log(`✅ ${trip.title} seeded/updated!`);
    }

    console.log('\n🌟 ALL PRODUCTION TRIPS SYNCED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
