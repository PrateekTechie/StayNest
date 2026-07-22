const Listing = require("../models/listing");
const Review = require("../models/review");
const { analyzeReview } = require("../services/reviewTrustService");

module.exports.CreateReview = async(req, res) => {
    const listing = await Listing.findById(req.params.id);
    const recentReviews = await Review.find({ _id: { $in: listing.reviews } }).sort({ createdAt: -1 }).limit(5);
    const authorReviewCount = await Review.countDocuments({ author: req.user._id });

    const reviewData = req.body.review;
    const analysis = analyzeReview({
        comment: reviewData.comment,
        rating: Number(reviewData.rating),
        authorReviewCount,
        recentReviews,
    });

    const newReview = new Review(reviewData);
    newReview.author = req.user._id;
    newReview.trustScore = analysis.trustScore;
    newReview.trustLabel = analysis.trustLabel;
    newReview.trustReasons = analysis.trustReasons;

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    req.flash("success", `Review submitted. ${analysis.trustLabel} with ${analysis.trustScore}% trust score.`);
    res.redirect(`/listings/${listing._id}`);
};

module.exports.DestroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: { reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "you have successfully deleted the review");

    res.redirect(`/listings/${id}`);
};
