const { expect } = require("chai");

const multiply = require("../utils/multiply.js");

describe("testing multiply", () => {
    // passing test
    it("should give 7*6 is 42", (done) => {
        expect(multiply(7, 6)).to.equal(42);
        done();
    });
    // failing test
    it("should give 7*6 is 42", (done) => {
        expect(multiply(7, 6)).to.equal(97);
        done();
    });
});
