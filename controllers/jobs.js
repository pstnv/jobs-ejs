const { StatusCodes } = require("http-status-codes");
const Job = require("../models/Job");
const parseValidationErrors = require("../utils/parseValidationErrs");

const getAllJobs = async (req, res) => {
    const { _id: userId } = req.user;
    try {
        const jobs = await Job.find({ createdBy: userId });
        res.render("jobs", { jobs });
    } catch (error) {
        throw new Error(error);
    }
};

const createJob = async (req, res) => {
    const { _id: createdBy } = req.user;
    try {
        await Job.create({ ...req.body, createdBy });
        res.redirect("/jobs");
    } catch (error) {
        if (error.constructor.name === "ValidationError") {
            parseValidationErrors(error, req);
            return res
                .status(StatusCodes.BAD_REQUEST)
                .render("job", { errors: req.flash("error") });
        } else {
            next(error);
        }
    }
};

const displayJobForm = async (req, res) => {
    res.render("job", { job: null });
};

const editJob = async (req, res) => {
    const { id: jobId } = req.params;
    try {
        const job = await Job.findOne({ _id: jobId });
        res.render("job", { job });
    } catch (error) {
        next(error);
    }
};

const updateJob = async (req, res) => {
    const { id: jobId } = req.params;
    try {
        await Job.findOneAndUpdate(
            { _id: jobId },
            { ...req.body },
            { new: true }
        );
        res.redirect("/jobs");
    } catch (error) {
        if (error.constructor.name === "ValidationError") {
            parseValidationErrors(error, req);
            return res
                .status(StatusCodes.BAD_REQUEST)
                .render("job", { errors: req.flash("error") });
        } else {
            next(error);
        }
    }
};

const deleteJob = async (req, res, next) => {
    const { id: jobId } = req.params;
    try {
        await Job.findByIdAndDelete({ _id: jobId });
        res.redirect("/jobs");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllJobs,
    createJob,
    displayJobForm,
    editJob,
    updateJob,
    deleteJob,
};
