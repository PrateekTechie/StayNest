const Listing = require("../models/listing");
const { parseNaturalLanguageSearch, buildMongoFilterFromSmartSearch } = require("../services/smartSearchService");
const mbxgeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAPBOX_TOKEN;
const geocodingClient = mbxgeocoding({ accessToken: mapToken });

function normalizeSearchText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function buildSort(sortValue) {
    switch (sortValue) {
        case "price-desc":
            return { price: -1 };
        case "newest":
            return { _id: -1 };
        case "price-asc":
        default:
            return { price: 1 };
    }
}

function buildActiveCriteria(searchText, parsedFilters, category) {
    const criteria = [];

    if (category) {
        criteria.push(category);
    }

    if (searchText) {
        criteria.push(`Search: ${searchText}`);
    }

    if (parsedFilters && parsedFilters.location) {
        criteria.push(parsedFilters.location);
    }

    if (parsedFilters && parsedFilters.maxPrice !== undefined) {
        criteria.push(`Under ₹${parsedFilters.maxPrice.toLocaleString("en-IN")}`);
    }

    if (parsedFilters && parsedFilters.minPrice !== undefined) {
        criteria.push(`From ₹${parsedFilters.minPrice.toLocaleString("en-IN")}`);
    }

    if (parsedFilters && parsedFilters.propertyType) {
        criteria.push(parsedFilters.propertyType);
    }

    if (parsedFilters && Array.isArray(parsedFilters.amenities) && parsedFilters.amenities.length > 0) {
        criteria.push(parsedFilters.amenities.join(", "));
    }

    if (parsedFilters && parsedFilters.guests) {
        criteria.push(`${parsedFilters.guests}+ guests`);
    }

    return criteria;
}

module.exports.index = async (req, res) => {
    const searchQuery = normalizeSearchText(req.query.search);
    const smartMode = req.query.smart === "1";
    const sortValue = normalizeSearchText(req.query.sort) || "price-asc";
    const category = normalizeSearchText(req.query.category);

    let filter = {};
    let parsedFilters = {};
    let activeCriteria = [];

    if (category) {
        filter.category = category;
    }

    if (searchQuery) {
        if (smartMode) {
            try {
                parsedFilters = await parseNaturalLanguageSearch(searchQuery);
                const smartFilter = buildMongoFilterFromSmartSearch(parsedFilters);

                if (Object.keys(smartFilter).length > 0) {
                    Object.assign(filter, smartFilter);
                } else {
                    filter.$or = [
                        { title: { $regex: searchQuery, $options: "i" } },
                        { location: { $regex: searchQuery, $options: "i" } },
                        { country: { $regex: searchQuery, $options: "i" } },
                        { category: { $regex: searchQuery, $options: "i" } },
                    ];
                }
            } catch (err) {
                console.error("Smart Search fallback:", err);
                filter.$or = [
                    { title: { $regex: searchQuery, $options: "i" } },
                    { location: { $regex: searchQuery, $options: "i" } },
                    { country: { $regex: searchQuery, $options: "i" } },
                    { category: { $regex: searchQuery, $options: "i" } },
                ];
            }
        } else {
            filter.$or = [
                { title: { $regex: searchQuery, $options: "i" } },
                { location: { $regex: searchQuery, $options: "i" } },
                { country: { $regex: searchQuery, $options: "i" } },
                { category: { $regex: searchQuery, $options: "i" } },
            ];
        }
    }

    activeCriteria = buildActiveCriteria(searchQuery, parsedFilters, category);

    const allListings = await Listing.find(filter).sort(buildSort(sortValue));

    res.locals.searchQuery = searchQuery;
    res.locals.searchMode = smartMode ? "smart" : "normal";

    res.render("listings/index.ejs", {
        allListings,
        selectedCategory: category,
        searchQuery,
        activeCriteria,
        resultCount: allListings.length,
        smartMode,
        sortValue,
    });
};

module.exports.smartSearch = async (req, res) => {
    const searchText = normalizeSearchText(req.body.search);

    if (!searchText) {
        req.flash("error", "Please enter a search query for Smart Search.");
        return res.redirect("/listings");
    }

    try {
        await parseNaturalLanguageSearch(searchText);
    } catch (err) {
        console.error("Smart Search error:", err);
        req.flash("error", "Smart search could not complete. Showing regular results instead.");
    }

    return res.redirect(`/listings?search=${encodeURIComponent(searchText)}&smart=1`);
};

module.exports.renderNewform = (req, res) => {
    res.render("listings/new.ejs", { listing: {} });
};

module.exports.ShowListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        });

    if (!listing) {
        req.flash("error", "Cannot find the listing");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
   let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1
})
  .send()
 
console.log(response.body.features);
console.log(response.body.features[0].geometry);
  

    let url = req.file.path;
    let filename = req.file.filename;                       
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.geometry = response.body.features[0].geometry;
    newListing.image = { 
        url,filename
    };

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    let  savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "You have successfully created a new listing");
    res.redirect(`/listings/${savedListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
if (typeof req.file !== "undefined" && req.file !== null) {
    let url = req.file.path;
    let filename = req.file.filename;

    listing.image = {
        url,
        filename
    };

    await listing.save();
}

    req.flash("success", "You have successfully updated the listing");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "You have successfully deleted the listing");
    res.redirect("/listings");
};