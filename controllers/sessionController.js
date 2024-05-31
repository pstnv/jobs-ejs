const { StatusCodes } = require("http-status-codes");

const User = require("../models/User.js");
const parseValidationErrors = require("../utils/parseValidationErrs.js");

const registerShow = (req, res) => {
    res.status(StatusCodes.OK).render("register");
};

const registerDo = async (req, res, next) => {
    if (req.body.password != req.body.password1) {
        req.flash("error", "The passwords entered do not match.");
        return res
            .status(StatusCodes.BAD_REQUEST)
            .render("register", { errors: flash("errors") });
    }

    try {
        await User.create(req.body);
        return res.status(StatusCodes.MOVED_TEMPORARILY).redirect("/");
    } catch (e) {
        if (e.constructor.name === "ValidationError") {
            parseValidationErrors(e, req);
            return res
                .status(StatusCodes.BAD_REQUEST)
                .render("register", { errors: flash("errors") });
        } else if (e.name === "MongoServerError" && e.code === 11000) {
            req.flash("error", "That email address is already registered.");
            return res
                .status(StatusCodes.BAD_REQUEST)
                .render("register", { errors: flash("errors") });
        } else {
            return next(e);
        }
    }
};

const logoff = (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        }
        res.status(StatusCodes.MOVED_TEMPORARILY).redirect("/");
    });
};

const logonShow = (req, res) => {
    if (req.user) {
        return res.status(StatusCodes.MOVED_TEMPORARILY).redirect("/");
    }
    res.status(StatusCodes.OK).render("logon");
};

module.exports = {
    registerShow,
    registerDo,
    logoff,
    logonShow,
};
