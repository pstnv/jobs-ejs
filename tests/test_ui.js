const chai = require("chai");
chai.use(require("chai-http"));

const { app, server } = require("../app");

const expect = chai.expect;

describe("test getting a page", function () {
    this.timeout(10000);
    after(() => {
        server.close();
    });
    it("should get the index page", (done) => {
        chai.request(app)
            .get("/")
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("text");
                expect(res.text).to.include("Click this link");
                done();
            });
    });
});
