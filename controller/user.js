const User = require("../models/user");
module.exports.renderSignupForm = (req,res) => {
    res.render("users/signup.ejs");
}
module.exports.signup =async (req, res, next) => {
    try {
     let { username, email, password } = req.body;
 if (!username || !email || !password) {
            req.flash("error", "Username, email and password are required.");
            return res.redirect("/user/signup");
        }
const newUser = new User({
            username,
            email,
        });

const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
 req.flash("success", "Welcome to StayNest!");
            res.redirect("/listings");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/user/signup");
    }
};

module.exports.renderLoginForm = (req,res) => {
    res.render("users/login.ejs");
}

module.exports.login = (req, res) => {
        req.flash("success", "Welcome back to StayNest!");

        let redirectUrl = res.locals.redirectUrl || "/listings";

        delete req.session.redirectUrl;

        res.redirect(redirectUrl);
    }

    module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You have successfully logged out");
        res.redirect("/listings");
    })
};