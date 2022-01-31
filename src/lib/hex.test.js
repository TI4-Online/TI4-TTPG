// the "it(string, function)" style works with mocha and jest frameworks
const { Hex } = require("./hex");
const assert = require("assert");

it("cannot construct", () => {
    assert.throws(() => {
        new Hex();
    });
});

it("fromPosition", () => {
    let pos = { x: 0, y: 0, z: 0 };
    let hex = Hex.fromPosition(pos);
    assert.equal(hex, "<0,0,0>");

    // Z does not matter.
    pos.z = 10;
    hex = Hex.fromPosition(pos);
    assert.equal(hex, "<0,0,0>");

    // +Y, two rings east.
    pos.x = 0;
    pos.y = Hex.HALF_SIZE * 3;
    hex = Hex.fromPosition(pos);
    assert.equal(hex, "<-1,2,-1>");
});

it("toPosition", () => {
    let hex = "<0,0,0>";
    let pos = Hex.toPosition(hex);
    assert.equal(pos.x, 0);
    assert.equal(pos.y, 0);
    assert.equal(pos.z, 0);

    // +Y, two rings east.
    hex = "<-1,2,-1>";
    pos = Hex.toPosition(hex);
    assert(Math.abs(pos.x) < 0.01);
    assert(Math.abs(pos.y - Hex.HALF_SIZE * 3) < 0.01);
    assert.equal(pos.z, 0);
});

it("corners", () => {
    let hex = "<0,0,0>";
    let corners = Hex.corners(hex);
    assert.equal(corners.length, 6);

    const top = (Hex.HALF_SIZE * Math.sqrt(3)) / 2;
    const halfRight = Hex.HALF_SIZE / 2;
    const right = Hex.HALF_SIZE;
    const halfLeft = -halfRight;
    const left = -right;
    const bottom = -top;

    // top-right
    assert(Math.abs(corners[0].x - top) < 0.01);
    assert(Math.abs(corners[0].y - halfRight) < 0.01);

    // top-left
    assert(Math.abs(corners[1].x - top) < 0.01);
    assert(Math.abs(corners[1].y - halfLeft) < 0.01);

    // left
    assert(Math.abs(corners[2].x - 0) < 0.01);
    assert(Math.abs(corners[2].y - left) < 0.01);

    // bottom-left
    assert(Math.abs(corners[3].x - bottom) < 0.01);
    assert(Math.abs(corners[3].y - halfLeft) < 0.01);

    // bottom-right
    assert(Math.abs(corners[4].x - bottom) < 0.01);
    assert(Math.abs(corners[4].y - halfRight) < 0.01);

    // bottom-left
    assert(Math.abs(corners[5].x - 0) < 0.01);
    assert(Math.abs(corners[5].y - right) < 0.01);
});

it("neighbors", () => {
    let hex = "<0,0,0>";
    let neighbors = Hex.neighbors(hex);
    assert.equal(neighbors.length, 6);
    assert.deepEqual(neighbors, [
        "<1,0,-1>",
        "<1,-1,0>",
        "<0,-1,1>",
        "<-1,0,1>",
        "<-1,1,0>",
        "<0,1,-1>",
    ]);
});
