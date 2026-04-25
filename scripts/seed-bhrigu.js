const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Ensure we are pointing to the correct model path
const Trip = require('../src/models/Trip');

const bhriguTrip = {
  title: "Bhrigu Lake Trek with Manali, Kasol & Amritsar",
  slug: "bhrigu-lake-trek-manali-kasol-amritsar",
  description: "Experience the magic of the Himalayas with a 9D/8N adventure that combines spiritual vibes, hippie culture, and a high-altitude trek to the mystical Bhrigu Lake at 14,300 ft.",
  location: "Himachal Pradesh & Punjab",
  price: 12999,
  duration: "9 Days / 8 Nights",
  category: "Trekking",
  difficulty: "moderate",
  maxGroupSize: 25,
  ageGroup: "15-35 years",
  maxAltitude: "14,300 ft",
  tripType: "Trekking Expedition",
  startEnd: "Amritsar to Amritsar",
  pickupMode: "Tempo Traveller / Cab",
  departureCity: "Ahmedabad",
  heroImage: "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=2000", // Bhrigu Lake/Himalayas
  thumbnail: "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
  images: [
    "https://images.unsplash.com/photo-1544735716-392fe2709496", // Bhrigu
    "https://images.unsplash.com/photo-1597037750734-450f6f406560", // Amritsar
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", // Manali
    "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c"  // Kasol
  ],
  gallery: [
    { url: "https://images.unsplash.com/photo-1544735716-392fe2709496", alt: "Bhrigu Lake Summit", order: 1 },
    { url: "https://images.unsplash.com/photo-1597037750734-450f6f406560", alt: "Golden Temple", order: 2 },
    { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", alt: "Manali Meadows", order: 3 },
    { url: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", alt: "Kasol Riverside", order: 4 }
  ],
  highlights: [
    "Bhrigu Lake Trek (14,300 ft)",
    "Kasol & Parvati Valley Experience",
    "Manali & Solang Valley Exploration",
    "Atal Tunnel crossing",
    "Golden Temple & Wagah Border",
    "Chalal Village Nature Walk"
  ],
  inclusions: [
    "Tempo Traveller / Cab for all transfers",
    "Round-trip train tickets (Sleeper/AC as per selection)",
    "Stay: Kasol, Manali, Bhrigu Camps",
    "Meals: 5 Breakfast, 5 Lunch, 5 Dinner",
    "Bhrigu Lake Trek with Certified guides",
    "Bonfire & music night in Kasol",
    "River rafting in Kullu",
    "Professional Trip Captain",
    "Toll, parking & driver charges"
  ],
  exclusions: [
    "Personal expenses & snacks",
    "Paragliding & optional adventure activities",
    "Entry tickets & local permits",
    "Snow gear / pony rides",
    "Heater charges in hotels",
    "Meals not mentioned in itinerary",
    "5% GST Extra"
  ],
  itinerary: [
    { 
      day: 1, 
      title: "Train Journey to Jalandhar", 
      location: "On Train", 
      description: "Departure from Ahmedabad. Group introduction and ice-breaking sessions. Overnight train journey.",
      activities: ["Group Introduction", "Train Games"]
    },
    { 
      day: 2, 
      title: "Amritsar Exploration & Drive to Kasol", 
      location: "Amritsar", 
      description: "Reach Jalandhar/Amritsar. Visit Wagah Border Ceremony and Golden Temple. Explore local Amritsar Market. Overnight drive to Kasol.",
      activities: ["Wagah Border Ceremony", "Golden Temple Visit", "Market Crawl"]
    },
    { 
      day: 3, 
      title: "Kasol & Parvati Valley", 
      location: "Kasol", 
      description: "Reach Kasol campsite. Chalal Village trek and visit Manikaran Sahib hot springs. Enjoy bonfire & music night.",
      stay: "Cottage/Tent (Kasol)",
      meals: "Breakfast, Lunch, Dinner",
      activities: ["Chalal Trek", "Manikaran Sahib visit", "Bonfire"]
    },
    { 
      day: 4, 
      title: "Start Bhrigu Lake Trek", 
      location: "Gulaba / Base Camp", 
      description: "Drive to base village. Begin trek to base camp (~10,000 ft). Enjoy scenic meadow views.",
      stay: "Bhrigu Base Camp",
      meals: "Breakfast, Lunch, Dinner",
      activities: ["Forest Trekking", "Camping"]
    },
    { 
      day: 5, 
      title: "Bhrigu Lake Summit Day", 
      location: "Bhrigu Lake (14,300 ft)", 
      description: "Trek to 14,300 ft. Navigate snow trails (seasonal) and explore the magical Bhrigu Lake. Summit celebration.",
      stay: "High Altitude Camp",
      meals: "Breakfast, Lunch, Dinner",
      activities: ["Summit Push", "Bhrigu Lake Exploration"]
    },
    { 
      day: 6, 
      title: "Trek Down & Manali Sightseeing", 
      location: "Manali", 
      description: "Descend from the trek. Visit Solang Valley, Atal Tunnel, Hadimba Temple & Mall Road shopping.",
      stay: "Hotel (Manali)",
      meals: "Breakfast, Lunch, Dinner",
      activities: ["Solang Valley", "Atal Tunnel", "Temple Visit"]
    },
    { 
      day: 7, 
      title: "Adventure Activities", 
      location: "Kullu / Manali", 
      description: "Included River Rafting experience. Optional Paragliding. Evening drive to Jalandhar.",
      meals: "Breakfast, Lunch",
      activities: ["River Rafting", "Paragliding (Optional)"]
    },
    { 
      day: 8, 
      title: "Return Train Journey", 
      location: "On Train", 
      description: "Board train for the return journey. Share memories and play group games.",
      activities: ["Memory Sharing"]
    },
    { 
      day: 9, 
      title: "Arrival", 
      location: "Home City", 
      description: "Reach your city. Trip ends with beautiful memories.",
      activities: ["Farewell"]
    }
  ],
  route: [
    { label: "Ahmedabad to Jalandhar", icon: "train" },
    { label: "Amritsar Sightseeing", icon: "car" },
    { label: "Drive to Kasol", icon: "car" },
    { label: "Trek to Bhrigu Base", icon: "car" },
    { label: "Summit Bhrigu Lake", icon: "car" },
    { label: "Descend to Manali", icon: "car" },
    { label: "Explore Manali", icon: "car" },
    { label: "Return to Jalandhar", icon: "car" },
    { label: "Jalandhar to Ahmedabad", icon: "train" }
  ],
  availableDates: [
    { date: "2026-04-25", capacity: 30 },
    { date: "2026-05-02", capacity: 30 },
    { date: "2026-05-09", capacity: 30 },
    { date: "2026-05-17", capacity: 30 },
    { date: "2026-05-23", capacity: 30 },
    { date: "2026-05-30", capacity: 30 },
    { date: "2026-06-06", capacity: 30 },
    { date: "2026-06-13", capacity: 30 },
    { date: "2026-06-20", capacity: 30 },
    { date: "2026-06-27", capacity: 30 },
    { date: "2026-07-04", capacity: 30 },
    { date: "2026-07-11", capacity: 30 }
  ],
  variants: [
    { location: "Ahmedabad", duration: "9D/8N", originalPrice: 15999, discountedPrice: 12999 },
    { location: "Vadodara / Surat", duration: "9D/8N", originalPrice: 16499, discountedPrice: 13499 },
    { location: "Mumbai / Pune", duration: "9D/8N", originalPrice: 16999, discountedPrice: 13999 },
    { location: "Jalandhar Direct", duration: "7D/6N", originalPrice: 14999, discountedPrice: 11999 }
  ],
  travelOptions: [
    { label: "Non-AC Sleeper Train", priceDelta: 0, description: "Standard sleeper journey." },
    { label: "AC 3 Tier Train", priceDelta: 2000, description: "Comfortable AC travel." }
  ],
  roomOptions: [
    { label: "Quad Sharing", priceDelta: 0 },
    { label: "Triple Sharing", priceDelta: 1000 },
    { label: "Double Sharing", priceDelta: 2000 }
  ],
  attractions: [
    { name: "Bhrigu Lake Trek", image: "https://images.unsplash.com/photo-1544735716-392fe2709496", slug: "bhrigu-lake" },
    { name: "Kasol & Parvati Valley", image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", slug: "kasol" },
    { name: "Manali & Solang Valley", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", slug: "manali" },
    { name: "Atal Tunnel", image: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff", slug: "atal-tunnel" },
    { name: "Golden Temple", image: "https://images.unsplash.com/photo-1597037750734-450f6f406560", slug: "golden-temple" },
    { name: "Wagah Border Ceremony", image: "https://images.unsplash.com/photo-1548013146-72479768b921", slug: "wagah-border" },
    { name: "Chalal Village Trek", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3", slug: "chalal" }
  ],
  popupDetails: {
    cancellation: [
      { label: "Before more than 40 days of Departure", val: "10% deduction" },
      { label: "Before 21 to 40 days of Departure", val: "25% deduction" },
      { label: "Before 11 to 20 days of Departure", val: "40% deduction" },
      { label: "Before 2 to 10 days of Departure", val: "60% deduction" },
      { label: "In the last 48 hours of Departure", val: "90% deduction" }
    ],
    terms: [
      "Itinerary subject to change based on weather.",
      "Valid ID proof is mandatory.",
      "YouthCamping decision final in all disputes."
    ],
    carry: [
      { label: "Clothing", val: "Thermal wear, Jackets, Trekking shoes, Gloves, Cap" },
      { label: "Essentials", val: "Backpack, Water bottle, Sunglasses, Sunscreen, Medicines" }
    ],
    etiquette: [
      { title: "No Littering", desc: "Keep the Himalayas clean." },
      { title: "Respect Local Culture", desc: "Be polite at religious sites." }
    ]
  },
  faqs: [
    { question: "Is this trip beginner-friendly?", answer: "Yes, but basic fitness is required for trekking." },
    { question: "Is trekking compulsory?", answer: "Yes, Bhrigu Lake trek is the main highlight of this trip." },
    { question: "What about safety?", answer: "Certified guides, trained drivers, and group support are provided throughout." },
    { question: "What kind of stays?", answer: "A mix of Hotels, Cottages, and High-Altitude Camps." }
  ],
  stickyCardPrice: 12999,
  stickyCardLabel: "per person",
  status: "published"
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");
    
    // Check if trip exists
    const existing = await Trip.findOne({ slug: bhriguTrip.slug });
    if (existing) {
       await Trip.updateOne({ slug: bhriguTrip.slug }, bhriguTrip);
       console.log("Updated Bhrigu Lake Trip!");
    } else {
       await new Trip(bhriguTrip).save();
       console.log("Seeded Bhrigu Lake Trip!");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
