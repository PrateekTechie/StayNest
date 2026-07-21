const Review = require("../models/review");
const Listing = require("../models/listing");
const { pickRandom, loadJson, createDate } = require("./utils");

const reviewTemplates = loadJson("reviewTemplates.json");

async function generateReviewsForListings(listings, authors) {
  const reviewDocs = [];
  for (const listing of listings) {
    const reviewCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < reviewCount; i += 1) {
      const template = pickRandom(reviewTemplates);
      reviewDocs.push({
        comment: template.comment,
        rating: template.rating,
        author: authors[Math.floor(Math.random() * authors.length)]._id,
        createdAt: createDate(180),
      });
    }
  }

  const insertedReviews = await Review.insertMany(reviewDocs, { ordered: false });
  const reviewIds = insertedReviews.map((review) => review._id);

  const listingUpdates = [];
  for (const listing of listings) {
    const listingReviews = reviewIds.splice(0, 2 + Math.floor(Math.random() * 4));
    listingUpdates.push(
      Listing.findByIdAndUpdate(listing._id, { $push: { reviews: { $each: listingReviews } } })
    );
  }

  await Promise.all(listingUpdates);
}

module.exports = {
  generateReviewsForListings,
};
