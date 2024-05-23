const express = require("express");
const router = express.Router();

const Job = require("../models/Job");

const {
    getAllJobs,
    createJob,
    displayJobForm,
    updateJob,
    editJob,
    deleteJob,
} = require("../controllers/jobs");

router
    .route("/")
    // Display all the job listings belonging to this user
    .get(getAllJobs)
    // Add a new job listing
    .post(createJob);

// Put up the form to create a new entry
router.route("/new").get(displayJobForm);

// Get a particular entry and show it in the edit box
router.route("/edit/:id").get(editJob);

// Update a particular entry
router.route("/update/:id").post(updateJob);

// Delete an entry
router.route("/delete/:id").post(deleteJob);

module.exports = router;
