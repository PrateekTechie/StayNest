const express = require("express");
const app = express();
const users = require ("./routes/users.js");
const posts = require("./routes/post.js");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

app.set("view engine","ejs");
app.set("views" ,path.join(__dirname,"/views"));


const sessionoptions = {
    secret: "mysupersecretstring",
    resave: false,
    saveuninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
    },
};
app.use(session(sessionoptions));
app.use(flash());

app.use((req,res,next) => {
    res.locals.successmsg = req.flash("success");
    res.locals.errormsg = req.flash("error");
    next();
})

app.get("/register", (req,res) => {
    let {name = "apna college"} = req.query;
    req.session.name = name;
    if(name === "prateeek") {
        req.flash("error", "you are not allowed to register as prateek");
    } else {
        req.flash("success", "you have successfully registered");
    }
    res.redirect("/login");
})

app.get("/login", (req,res)=> {
    res.locals.successmsg = req.flash("success");
    res.locals.errormsg = req.flash("error");
    res.render("page.ejs", { name: req.session.name });
});

// app.use(session({ secret:"mysupersecretstring"}));

// app.get("/test", (req,res) => {
//     res.send(" This test is succesfully");
// });
// const cookieParser = require("cookie-parser");

// app.use(cookieParser());

// app.get("/getcookies", (req, res) => {
//     res.cookie("greet", "hello");
//     res.cookie("age", 25);
//     res.send("some type of cookies are here");
// });

// app.get("/greet" ,(req, res) => {
//     let{name = "Prateek"} = req.cookies;
//     res.send(`Hello, ${name}!`);
// });


// app.get("/", (req, res) => {
//     res.send("Hi i am robot");
// });
// app.use("/users", users);
// app.use("/posts", posts);




app.listen(3000, () => {
    console.log("server is running on the port 3000");
});