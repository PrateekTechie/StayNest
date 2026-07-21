const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b",
        },
    },

    price: {
        type: Number,
        required: true,
        min: [0, "Price must be a positive number"],
    },

    location: {
        type: String,
    },

    country: {
        type: String,
    },

    propertyType: {
        type: String,
    },

    amenities: [
        {
            type: String,
        },
    ],

    guests: {
        type: Number,
        min: [1, "Guests must be at least 1"],
    },

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "user",
    },
    geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
},

category: {
    type: String,
    required: true,
    enum: [
        "Trending",
        "Room",
        "Iconic Cities",
        "Mountains",
        "Castles",
        "Arctic",
        "Beaches",
        "Camping",
        "Farms",
        "Villas"
    ]
},
});




// Delete all reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({
            _id: { $in: listing.reviews },
        });
    }
});

// Create the Mongoose model
const Listing =
    mongoose.models.Listing ||
    mongoose.model("Listing", listingSchema);

module.exports = Listing;
