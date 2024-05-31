const { expect } = require("chai");

const puppeteer = require("puppeteer");

const { app, server } = require("../app");

const { factory, seed_db, testUserPassword } = require("../utils/seed_db");
const Job = require("../models/Job");
const { create } = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;

describe("Functional Tests with Puppeteer", function () {
    // this.timeout(50000);

    let browser = null;
    let page = null;

    before(async function () {
        this.timeout(10000);
        // Launch the browser and open a new blank page
        // add {headless: false, slowMo: 30} to brackets to watch how puppeteer works
        browser = await puppeteer.launch();
        page = await browser.newPage();
        // Navigate the page to a URL
        const port = process.env.PORT || 3000;
        await page.goto(`http://localhost:${port}`);
    });
    after(async function () {
        this.timeout(10000);
        // close browser after testing
        await browser.close();
        server.close();
        return;
    });
    describe("got to site", function () {
        this.timeout(10000);
        it("should have completed a connection", function (done) {
            done();
        });
    });
    // testing index page
    describe("testing index page", function () {
        this.timeout(10000);
        it("should have register and logon link", async () => {
            this.registerLink = await page.waitForSelector(
                'a[href="/session/register"]'
            );
            this.logonLink = await page.waitForSelector(
                'a[href="/session/logon"]'
            );
        });
        it("should open register page", async () => {
            await this.registerLink.click();
            await page.waitForNavigation();
            // a button with text 'Register'
            await page.waitForSelector("button::-p-text(Register)");
        });
    });

    // testing register page
    describe("testing register page", function () {
        this.timeout(30000);
        it("should have register form with various elements", async () => {
            this.nameField = await page.waitForSelector('input[name="name"]');
            this.emailField = await page.waitForSelector('input[name="email"]');
            this.passwordField = await page.waitForSelector(
                'input[name="password"]'
            );
            this.password1Field = await page.waitForSelector(
                'input[name="password1"]'
            );
            this.btnRegister = await page.waitForSelector(
                "button::-p-text(Register)"
            );
            this.btnCancel = await page.waitForSelector(
                "button::-p-text(Cancel)"
            );
        });
        it("should register the user", async () => {
            // create user
            this.password = faker.internet.password();
            this.user = await factory.build("user", {
                password: this.password,
            });
            // fill the register form
            await this.nameField.type(this.user.name);
            await this.emailField.type(this.user.email);
            await this.passwordField.type(this.password);
            await this.password1Field.type(this.password);
            await this.btnRegister.click();
            // redirects to the index page
            await page.waitForNavigation();
            await page.waitForSelector(
                "h1 ::-p-text(The Jobs EJS Application)"
            );
            await page.waitForSelector(
                "p ::-p-text(A copyright could go here)"
            );
        });
    });

    // after register we are redirected to the index page
    describe("should open the index page", function () {
        this.timeout(10000);
        it("should have register and logon link", async () => {
            // register link
            this.registerLink = await page.waitForSelector(
                'a[href="/session/register"]'
            );
            // logon link
            this.logonLink = await page.waitForSelector(
                'a[href="/session/logon"]'
            );
        });
        it("should open logon page", async () => {
            await this.logonLink.click();
            await page.waitForNavigation();
            // a button with text 'Logon'
            await page.waitForSelector("button::-p-text(Logon)");
        });
    });

    // testing logon page
    describe("testing logon page", function () {
        this.timeout(20000);
        it("should have logon form with various elements", async () => {
            this.emailField = await page.waitForSelector('input[name="email"]');
            this.passwordField = await page.waitForSelector(
                'input[name="password"]'
            );
            this.btnLogon = await page.waitForSelector(
                "button::-p-text(Logon)"
            );
            this.btnCancel = await page.waitForSelector(
                "button::-p-text(Cancel)"
            );
        });
        it("should logon the user", async () => {
            // create 1 testUser with 20 Job records in MongoDB
            const testUser = await seed_db();
            this.user = testUser;
            this.user.password = testUserPassword;

            // fill the register form
            await this.emailField.type(this.user.email);
            await this.passwordField.type(this.user.password);
            await this.btnLogon.click();
            // redirects to the index page
            await page.waitForNavigation();
            await page.waitForSelector(
                "h1 ::-p-text(The Jobs EJS Application)"
            );
            await page.waitForSelector(
                `p ::-p-text(User ${this.user.name} is logged on)`
            );
            await page.waitForSelector(
                "p ::-p-text(A copyright could go here)"
            );
        });
    });

    // after logon we are redirected to the index page
    describe("should get the index page", function () {
        this.timeout(10000);
        it("should have links for logged in user", async () => {
            // logoff button
            await page.waitForSelector("button::-p-text(Logoff)");
            // secret word route
            await page.waitForSelector('a[href="/secretWord"]');
            // jobs route
            this.jobsLink = await page.waitForSelector('a[href="/jobs"]');
        });
        it("should open jobs page", async () => {
            await this.jobsLink.click();
            await page.waitForNavigation();
            // a button with text 'Add A Job'
            await page.waitForSelector('a[href="/jobs/new"]');
            // await page.waitForSelector("button::-p-text(Add A Job)");
        });
    });

    // testing jobs page
    describe("testing jobs page", function () {
        this.timeout(20000);
        it("should have jobs list and various elements", async () => {
            await page.waitForSelector(
                "h1 ::-p-text(The Jobs EJS Application)"
            );
            // logoff button
            await page.waitForSelector("button::-p-text(Logoff)");
            // Jobs List
            await page.waitForSelector("h2 ::-p-text(Jobs List)");
            // a button with text 'Add A Job'
            this.btnAddJob = await page.waitForSelector(
                "button::-p-text(Add A Job)"
            );
        });
        it("should have 20 entries in the jobs list", async () => {
            // verify that 20 entries returned -
            // check how many times <tr> appears on the page
            // should return 21 (with table header)
            const pageContent = await page.content();
            const tableRowsCount = pageContent.split("<tr>").length;
            expect(tableRowsCount).to.equal(21);
        });
        it("should open the page with add a job form", async () => {
            await this.btnAddJob.click();
            await page.waitForNavigation();
            // form
            await page.waitForSelector("h2::-p-text(Adding a Job Listing)");
        });
    });

    // testing Add a job page
    describe("testing add a job page", function () {
        this.timeout(30000);
        it("should have add a job form with various elements", async () => {
            // form
            this.companyField = await page.waitForSelector(
                'input[name="company"]'
            );
            this.positionField = await page.waitForSelector(
                'input[name="position"]'
            );
            this.statusField = await page.waitForSelector(
                'select[name="status"]'
            );
            // get selected value from status select (should be "pending" by default)
            const defaultStatus = await (
                await this.statusField.getProperty("value")
            ).jsonValue();
            expect(defaultStatus).to.equal("pending");
            this.btnAdd = await page.waitForSelector("button::-p-text(add)");
            await page.waitForSelector("button::-p-text(cancel)");
        });
        it("should create a job entry", async () => {
            // create new job entry
            this.job = await factory.build("job");
            // fill create job form
            await this.companyField.type(this.job.company);
            await this.positionField.type(this.job.position);
            await this.statusField.select(this.job.status);
            await this.btnAdd.click();

            // expect redirects to Jobs List page
            await page.waitForNavigation();
            await page.waitForSelector("h2 ::-p-text(Jobs List)");
            // verify that the message says that the job listing has been added
            await page.waitForSelector(
                "div ::-p-text(Info: The job  was created)"
            );
            // check the database to see that the latest jobs entry has the data entered
            const newJob = await Job.findOne(
                {
                    company: this.job.company,
                    position: this.job.position,
                    status: this.job.status,
                },
                {},
                { sort: { createdAt: -1 } }
            );
            expect(newJob).to.not.be.null;
        });
    });
});
