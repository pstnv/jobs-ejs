const chai = require("chai");
chai.use(require("chai-http"));

const { app, server } = require("../app");

const expect = chai.expect;

const { factory, seed_db, testUserPassword } = require("../utils/seed_db");

const Job = require("../models/Job");

describe("tests for Job CRUD Operations", function () {
    this.timeout(100000);
    after(() => {
        server.close();
    });

    it("should get the logon page to get the CSRF token and cookie", (done) => {
        chai.request(app)
            .get("/session/logon")
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                expect(res.text).to.include("Enter your email");
                // delete new lines
                const textNoLineEnd = res.text.replaceAll("\n", "");
                // search for crsf token in input for (for secret token), returns array
                const csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
                expect(csrfToken).to.not.be.null;
                // returns array, destructuring array
                this.csrfToken = csrfToken[1];
                // get cookies
                expect(res).to.have.property("headers");
                expect(res.headers).to.have.property("set-cookie");
                const cookies = res.headers["set-cookie"];
                const csrfCookie = cookies.find((element) =>
                    element.startsWith("csrfToken")
                );
                expect(csrfCookie).to.not.be.undefined;
                this.csrfCookie = csrfCookie;
                done();
            });
    });

    it("should log the user on", async () => {
        // create 1 testUser with 20 Job records in MongoDB
        const testUser = await seed_db();
        this.user = testUser;
        this.user.password = testUserPassword;

        const dataToPost = {
            email: this.user.email,
            password: this.user.password,
            _csrf: this.csrfToken,
        };
        try {
            const request = chai
                .request(app)
                .post("/session/logon")
                .set("Cookie", this.csrfCookie)
                .set("content-type", "application/x-www-form-urlencoded")
                .redirects(0)
                .send(dataToPost);
            res = await request;
            expect(res).to.have.status(302);
            expect(res.headers.location).to.equal("/");
            const cookies = res.headers["set-cookie"];
            this.sessionCookie = cookies.find((element) =>
                element.startsWith("connect.sid")
            );
            expect(this.sessionCookie).to.not.be.undefined;
        } catch (err) {
            console.log(err);
            expect.fail("Logon request failed");
        }
    });

    it("should display the job list belonging to the user", (done) => {
        // 20 entries
        chai.request(app)
            .get("/jobs")
            .set("Cookie", this.sessionCookie)
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                // verify that 20 entries returned -
                // check how many times <tr> appears on the page
                // should return 21 (with table header)
                const pageParts = res.text.split("<tr>");
                expect(pageParts.length).to.equal(21);
                done();
            });
    });

    it("should create job entry", async () => {
        // create new job entry
        const testJob = await factory.build("job");

        const dataToPost = {
            company: testJob.company,
            position: testJob.position,
            status: testJob.status,
            _csrf: this.csrfToken,
        };

        try {
            const request = chai
                .request(app)
                .post("/jobs")
                .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
                .set("content-type", "application/x-www-form-urlencoded")
                .send(dataToPost);
            res = await request;

            // expect page redirects to display all jobs
            expect(res).to.have.status(200);
            expect(res).to.have.property("text");
            expect(res.text).to.include("Jobs List");

            // check weather new job document can be found in MongoDB
            newJob = await Job.findOne({
                company: dataToPost.company,
                position: dataToPost.position,
                status: dataToPost.status,
                createdBy: this.user._id,
            });
            expect(newJob).to.not.be.null;
        } catch (err) {
            console.log(err);
            expect.fail("Create job request failed");
        }
    });
});
