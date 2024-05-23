const chai = require("chai");
chai.use(require("chai-http"));

const { app, server } = require("../app");

const expect = chai.expect;

describe("test multiply api", function () {
    this.timeout(10000)
    after(() => {
        server.close();
    });
    it("should multiply two numbers", (done) => {
        chai.request(app)
            .get("/multiply")
            .query({ first: 7, second: 6 })
            .send()
            .end((err, res) => {
                expect(err).to.equal(null);
                expect(res).to.have.status(200);
                expect(res).to.have.property("body");
                expect(res.body).to.have.property("result");
                expect(res.body.result).to.equal(42);
                done();
            });
    });
});
