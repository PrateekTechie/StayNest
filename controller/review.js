const Listing = require("../models/listing");
const Review = require("../models/review");
module.exports.CreateReview = async(req, res) => {
    console.log(req.params.id);
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    req.flash("success", "you have successfully added a new review");
    
    res.redirect(`/listings/${listing._id}`);
};

module.exports.DestroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: { reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "you have successfully deleted the review");

    res.redirect(`/listings/${id}`);
};
