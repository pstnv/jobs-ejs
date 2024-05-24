const { StatusCodes } = require("http-status-codes");
const Job = require("../models/Job");
const parseValidationErrors = require("../utils/parseValidationErrs");

const getAllJobs = async (req, res) => {
    const { _id: userId } = req.user;
    try {
        const jobs = await Job.find({ createdBy: userId });
        res.status(StatusCodes.OK).render("jobs", { jobs });
    } catch (error) {
        throw new Error(error);
    }
};

const createJob = async (req, res) => {
    const { _id: createdBy } = req.user;
    try {
        await Job.create({ ...req.body, createdBy });
        res.status(StatusCodes.CREATED).redirect("/jobs");
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
    res.status(StatusCodes.OK).render("job", { job: null });
};

const editJob = async (req, res) => {
    const { id: jobId } = req.params;
    try {
        const job = await Job.findOne({ _id: jobId });
        res.status(StatusCodes.OK).render("job", { job });
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
        res.status(StatusCodes.OK).redirect("/jobs");
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
        res.status(StatusCodes.OK).redirect("/jobs");
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