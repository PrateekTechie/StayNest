const express = require("express");
const router = express.Router({mergeParams: true});
const WrapAsync = require("../utils/wrapasync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const { validateReview, isloggedin,isReviewAuthor} = require("../middleware.js");


const reviewController = require("../controller/review.js");

//Reviews routes
//POST routes to add a review to a Listings 

router.post("/",
    isloggedin,
    validateReview,WrapAsync(reviewController.CreateReview)
);
//delete route to delete a review from a listing 
router.delete("/:reviewId",isloggedin,isReviewAuthor, WrapAsync(reviewController.DestroyReview));
module.exports = router;