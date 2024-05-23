const chai = require("chai");
chai.use(require("chai-http"));

const { app, server } = require("../app");

const expect = chai.expect;

const { factory, seed_db } = require("../utils/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;

const User = require("../models/User");

describe("tests for registration and logon", function () {
    this.timeout(10000);
    after(() => {
        server.close();
    });
    it("should get the registration page", (done) => {
        chai.request(app)
            .get("/sessions/register")
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
                const cookieValue = /csrfToken=(.*?);\s/.exec(csrfCookie);
                this.csrfCookie = cookieValue[1];
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
                .post("/sessions/register")
                .set("Cookie", `csrfToken=${this.csrfCookie}`)
                .set("content-type", "application/x-www-form-urlencoded")
                .send(dataToPost);
            res = await request;
            console.log("got here");
            expect(res).to.have.status(200);
            expect(res).to.have.property("text");
            expect(res.text).to.include("Jobs List");
            newUser = await User.findOne({ email: this.user.email });
            expect(newUser).to.not.be.null;
            console.log(newUser);
        } catch (err) {
            console.log(err);
            expect.fail("Register request failed");
        }
    });
});
