require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listing');

(async () => {
  try {
    await mongoose.connect(process.env.ATLASDB_URL);
    const count = await Listing.countDocuments();
    console.log('count', count);
    const docs = await Listing.find().limit(5);
    console.log('sample', docs.map(d => ({ title: d.title, location: d.location, country: d.country, category: d.category, price: d.price })));
    const term = 'mumbai';
    const matched = await Listing.find({ $or: [
      { title: { $regex: term, $options: 'i' } },
      { location: { $regex: term, $options: 'i' } },
      { country: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } }
    ] }).limit(5);
    console.log('matched', matched.map(d => ({ title: d.title, location: d.location, country: d.country, category: d.category, price: d.price })));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
