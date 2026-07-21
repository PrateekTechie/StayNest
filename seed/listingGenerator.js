const Listing = require("../models/listing");
const User = require("../models/user");
const { loadJson, pickRandom, pickRandomCount, createPrice } = require("./utils");

const cities = loadJson("cities.json");
const categories = loadJson("categories.json");
const propertyTypes = loadJson("propertyTypes.json");
const amenities = loadJson("amenities.json");
const imagePool = loadJson("imagePool.json");

function createTitle(city, country, propertyType) {
  const templates = [
    `Luxury ${propertyType} in ${city}`,
    `Modern ${propertyType} in ${city}`,
    `Stylish ${propertyType} in ${city}`,
    `Scenic ${propertyType} near ${city}`,
    `Beautiful ${propertyType} in ${city}`,
    `${propertyType} with ${city} skyline views`,
    `${propertyType} in ${city}, ${country}`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function createDescription(city, country, propertyType) {
  return `Enjoy a premium stay in ${city}, ${country} with this ${propertyType.toLowerCase()} designed for comfort, convenience, and memorable travel experiences.`;
}

function createListingPayload(index, ownerId) {
  const locationData = pickRandom(cities);
  const propertyType = pickRandom(propertyTypes);
  const selectedAmenities = pickRandomCount(amenities, 3, 7);
  const category = pickRandom(categories);

  const basePrice = [3000, 4500, 6500, 9000, 12000, 18000, 25000][index % 7];

  return {
    title: createTitle(locationData.city, locationData.country, propertyType),
    description: createDescription(locationData.city, locationData.country, propertyType),
    price: createPrice(basePrice, 0.25),
    location: locationData.city,
    country: locationData.country,
    propertyType,
    amenities: selectedAmenities,
    category,
    guests: 2 + (index % 6),
    owner: ownerId,
    image: {
      url: pickRandom(imagePool),
      filename: `seed-${index + 1}`,
    },
    geometry: {
      type: "Point",
      coordinates: [locationData.lng, locationData.lat],
    },
  };
}

async function generateListings(count, owners) {

  // Use the first existing user as the owner
  const myAccount = await User.findOne().sort({ _id: 1 });

  if (!myAccount) {
    throw new Error("No user found in the database.");
  }

  console.log("Using owner:", myAccount.username);

  const listings = [];

  for (let i = 0; i < count; i++) {

    const ownerId =
      i < 100
        ? myAccount._id
        : owners[i % owners.length]._id;

    listings.push(createListingPayload(i, ownerId));
  }

  return Listing.insertMany(listings, { ordered: false });
}

module.exports = {
  generateListings,
};