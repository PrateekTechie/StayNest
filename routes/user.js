const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controller/user.js");

// Signup Page
router.get("/signup", userController.renderSignupForm);

// Signup Route
router.post("/signup", userController.signup);

// Login Page
router.get("/login", userController.renderLoginForm);

// Login Route
router.post("/login",saveRedirectUrl,passport.authenticate("local", 
    {
        failureRedirect: "/user/login",
        failureFlash: true,
    }),
    userController.login
    
);

// Logout Route
router.get("/logout", userController.logout);
module.exports = router;