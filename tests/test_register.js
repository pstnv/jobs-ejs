const chai = require("chai");
chai.use(require("chai-http"));

const { app, server } = require("../app");

const expect = chai.expect;

const { factory, seed_db } = require("../utils/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;

const User = require("../models/User");

describe("tests for registration and logon", function () {
    this.timeout(100000);
    after(() => {
        server.close();
    });
    it("should get the registration page", (done) => {
        chai.request(app)
            .get("/session/register")
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                expect(res.text).to.include("Enter your name");
                // delete new lines
                const textNoLineEnd = res.text.replaceAll("\n", "");
                // search for crsf token in input for (for secret token), returns array
                const csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
                expect(csrfToken).to.not.be.null;
                // returns array, destructuring array
                this.csrfToken = csrfToken[1];
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

    it("should register the user", async () => {
        this.password = faker.internet.password();
        this.user = await factory.build("user", { password: this.password });

        const dataToPost = {
            name: this.user.name,
            email: this.user.email,
            password: this.password,
            password1: this.password,
            _csrf: this.csrfToken,
        };

        try {
            const request = chai
                .request(app)
                .post("/session/register")
                .set("Cookie", this.csrfCookie)
                .set("content-type", "application/x-www-form-urlencoded")
                .send(dataToPost);
            res = await request;
            expect(res).to.have.status(200);
            expect(res).to.have.property("text");
            expect(res.text).to.include("Jobs List");
            newUser = await User.findOne({ email: this.user.email });
            expect(newUser).to.not.be.null;
        } catch (err) {
            console.log(err);
            expect.fail("Register request failed");
        }
    });

    it("should log the user on", async () => {
        const dataToPost = {
            email: this.user.email,
            password: this.password,
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

    it("should get the index page with user name", (done) => {
        chai.request(app)
            .get("/")
            .set("Cookie", this.sessionCookie)
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                expect(res.text).to.include(this.user.name);
                done();
            });
    });

    it("should log the user off", (done) => {
        const dataToPost = {
            _csrf: this.csrfToken,
        };
        chai.request(app)
            .post("/session/logoff")
            .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
            .set("content-type", "application/x-www-form-urlencoded")
            .redirects(0)
            .send(dataToPost)
            .end((err, res) => {
                expect(err).to.equal(null);
                // expecting redirecting
                expect(res).to.have.status(302);
                expect(res.headers.location).to.equal("/");
                // expecting no cookies (undefined)
                const sessionCookie = res.headers["set-cookie"];
                expect(sessionCookie).to.be.undefined;
                done();
            });
    });

    it("should get the index page without user name after user logged off", (done) => {
        chai.request(app)
            .get("/")
            .set("Cookie", this.sessionCookie)
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                expect(res.text).not.to.include(this.user.name);
                done();
            });
    });
});
