const express = require("express");
const router = express.Router();
const WrapAsync = require("../utils/wrapasync.js");
const Listing = require("../models/listing.js");
const {isloggedin, isOwner,validateListing} = require("../middleware.js");

const listingController = require("../controller/listing.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage});

console.log("index:", typeof listingController.index);
console.log("createListing:", typeof listingController.createListing);
console.log("renderNewform:", typeof listingController.renderNewform);
console.log("isloggedin:", typeof isloggedin);
console.log("validateListing:", typeof validateListing);
console.log("upload.single:", typeof upload.single("listing[image]"));

router.route("/")
.get( WrapAsync(listingController.index) )
.post(
    isloggedin,
    upload.single("listing[image]"),
    validateListing,
    WrapAsync(listingController.createListing)
);

router.post("/smart-search", WrapAsync(listingController.smartSearch));

        //new route to show form to create new listing
        router.get("/new",isloggedin, listingController.renderNewform);

    router.route("/:id")
    .get( WrapAsync(listingController.ShowListing) )
    .put( isloggedin, isOwner,
        upload.single("listing[image]"),
        validateListing, 
        WrapAsync(listingController.updateListing) )
    .delete( isloggedin, isOwner, WrapAsync(listingController.destroyListing) );




//edit route to show the form to edit the listing 
router.get("/:id/edit", isloggedin, isOwner, WrapAsync( listingController.renderEditForm));
//delete route to delete a listing


module.exports = router;

