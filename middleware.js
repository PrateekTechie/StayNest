const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

// Check login
module.exports.isloggedin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in first!");
        return res.redirect("/user/login");
    }
    next();
};

// Save redirect URL
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Check listing owner
module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing.owner.equals(res.locals.currentUser._id)) {
        req.flash("error", "You do not have permission.");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

//  Validate Listing
module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const errorMessage = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errorMessage);
    }

    next();
};

// Validate Review
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (error) {
        const errorMessage = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errorMessage);
    }

    next();
};

// Check review author
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review.author.equals(res.locals.currentUser._id)) {
        req.flash("error", "You do not have permission.");
        return res.redirect(`/listings/${id}`);
    }

    next();
};