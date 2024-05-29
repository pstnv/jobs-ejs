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
                console.log("наш куки из инпута");
                console.log(csrfToken[1]);
                // returns array, destructuring array
                this.csrfToken = csrfToken[1];
                expect(res).to.have.property("headers");
                expect(res.headers).to.have.property("set-cookie");
                const cookies = res.headers["set-cookie"];
                const csrfCookie = cookies.find((element) =>
                    element.startsWith("csrfToken")
                );
                console.log("куки из заголовка");
                console.log(csrfCookie);
                expect(csrfCookie).to.not.be.undefined;
                const cookieValue = /csrfToken=(.*?);\s/.exec(csrfCookie);
                console.log("куки из регекса");
                console.log(cookieValue);
                this.csrfCookie = cookieValue[1];
                console.log("установили куки");
                console.log(this.csrfCookie);
                done();
            });
    });

    it("should register the user", async () => {
        this.password = faker.internet.password();
        this.user = await factory.build("user", { password: this.password });
        // console.log(this.user)
        const dataToPost = {
            name: this.user.name,
            email: this.user.email,
            password: this.password,
            password1: this.password,
            _csrf: this.csrfToken,
        };
        console.log("регистрируем этого пользователя");
        console.log(dataToPost);

        try {
            const request = chai
                .request(app)
                .post("/session/register")
                .set("Cookie", `csrfToken=${this.csrfCookie}`)
                .set("content-type", "application/x-www-form-urlencoded")
                .send(dataToPost);
            res = await request;
            // console.log("got here");
            expect(res).to.have.status(200);
            expect(res).to.have.property("text");
            expect(res.text).to.include("Jobs List");
            newUser = await User.findOne({ email: this.user.email });
            expect(newUser).to.not.be.null;
            console.log("сервер вернул ответ");
            console.log(newUser);
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
        console.log("логин. отправляем на сервер запрос");
        console.log(this.csrfCookie);
        console.log(dataToPost);
        try {
            const request = chai
                .request(app)
                .post("/session/logon")
                .set("Cookie", this.csrfCookie)
                .set("content-type", "application/x-www-form-urlencoded")
                .redirects(0)
                .send(dataToPost);
            res = await request;
            console.log("пришел ответ");
            console.log(res.status);
            console.log(res.text);
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
    it("should get the index page", (done) => {
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
});
