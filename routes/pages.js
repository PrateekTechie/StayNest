const express = require("express");
const router = express.Router();

router.get("/privacy", (req, res) => {
    res.render("pages/privacy");
});

router.get("/terms", (req, res) => {
    res.render("pages/terms");
});

router.get("/explore", (req, res) => {
    res.render("pages/explore");
});

router.get("/help", (req, res) => {
    res.render("pages/help");
});

router.get("/about", (req, res) => {
    res.render("pages/about");
});

module.exports = router;