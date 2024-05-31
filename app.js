require("dotenv").config();
const { StatusCodes } = require("http-status-codes");

const express = require("express");
require("express-async-errors");

const app = express();

// middleware
app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(express.json());
// cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.SESSION_SECRET));
// extra security packages
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
    mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
    // may throw an error, which won't be caught
    uri: mongoURL,
    collection: "mySessions",
});
store.on("error", function (error) {
    console.log(error);
});

const sessionParams = {
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false, sameSite: "strict" },
};

// csrf
const csrf = require("host-csrf");
let csrf_development_mode = true;

if (app.get("env") === "production") {
    app.set("trust proxy", 1); // trust first proxy
    sessionParams.cookie.secure = true; // serve secure cookies
    csrf_development_mode = false;
}

app.use(session(sessionParams));

// passport
const passport = require("passport");
const passportInit = require("./passport/passportInit.js");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

// csrf
const csrf_options = {
    protected_operations: ["POST"],
    // protected_content_types: ["application/json"],
    development_mode: csrf_development_mode,
    //
    // cookieName: "csrf_cookie",
};
const csrf_middleware = csrf(csrf_options); //initialize and return middlware
app.use(csrf_middleware);

// security
app.use(
    rateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })
);
app.use(helmet());
app.use(xss());

// flash messages
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals.js"));
app.get("/", (req, res) => {
    res.render("index");
});

// secret word handling
const secretWordRouter = require("./routes/secretWord.js");
// authentication middleware
const auth = require("./middleware/auth.js");
// multiply middleware
app.use((req, res, next) => {
    if (req.path == "/multiply") {
        res.set("Content-Type", "application/json");
    } else {
        res.set("Content-Type", "text/html");
    }
    next();
});
// routes
// multiply API route
app.get("/multiply", (req, res) => {
    const result = req.query.first * req.query.second;
    if (result.isNaN) {
        result = "NaN";
    } else if (result == null) {
        result = "null";
    }
    res.json({ result: result });
});
// session route
const sessionRouter = require("./routes/sessionRoutes.js");
app.use("/session", sessionRouter);
app.use("/secretWord", auth, secretWordRouter);
// jobs router
const jobsRouter = require("./routes/jobs.js");
app.use("/jobs", auth, jobsRouter);

app.use((req, res) => {
    res.status(404).send(`That page ${req.url} was not found.`);
});
app.use((err, req, res, next) => {
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(
        "Something went wrong. Try again later..."
    );
});

const port = process.env.PORT || 3000;
const start = () => {
    try {
        require("./db/connect.js")(mongoURL);
        return app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
};

const server = start();

module.exports = { app, server };
