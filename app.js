if(process.env.NODE_ENV != "production") {
 require('dotenv').config();
}

console.log(process.env.MAPBOX_TOKEN);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const ListingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/Review.js")
const userRouter = require("./routes/user.js")
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/user.js");
const paymentRouter = require("./routes/payment.js");
const pagesRouter = require("./routes/pages");



app.engine("ejs", ejsmate);
app.set("view engine","ejs");
app.set("views" ,path.join(__dirname,"/views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

// const mongo_url ="mongodb://127.0.0.1:27017/wonderlust";
const mongo_url = process.env.ATLASDB_URL;

app.use((req, res, next) => { 
    res.locals.currentPath = req.path; next(); 
});

main()
.then(() => {
    console.log("Connected to MongoDB");
})
.catch(err => {
    console.error("failed to connect the mongodb", err);
});


async function main() {
    await mongoose.connect(mongo_url);

}
const store = MongoStore.create({
    mongoUrl: mongo_url,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Session Store Error:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        MaxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly:true,
    },
};

// app.get("/", (req, res) => {
//     res.send("hey man")
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    res.locals.currentPath = req.path;
    next();
});

app.use("/", pagesRouter); 

app.get("/", (req, res) => {
    res.redirect("/listings");
});





// app.get("/demouser", async (req,res) => {
//   let fakeuser = new user ({
//     username: "demo",
//     email:"demo@gmail.com"
//   });
//  let registeruser = await user.register(fakeuser,"Prateek");
//  res.send(registeruser);

// })

app.use("/listings", ListingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/user", userRouter);
app.use("/payments", paymentRouter);


// If no route matches
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    // Only print real server errors
    if (statusCode !== 404) {
        console.error(err);
    }

    res.status(statusCode).render("error.ejs", { message });
});
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});