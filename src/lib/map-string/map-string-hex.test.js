const {
    hexToIdx,
    idxToHex,
    hexStringToIdx,
    idxToHexString,
} = require("./map-string-hex");
const assert = require("assert");

const first_ring = [
    { q: 1, r: 0, s: -1 },
    { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 },
    { q: -1, r: 0, s: 1 },
    { q: 0, r: -1, s: 1 },
    { q: 1, r: -1, s: 0 },
];

const fourth_ring = [
    { q: 4, r: 0, s: -4 },
    { q: 3, r: 1, s: -4 },
    { q: 2, r: 2, s: -4 },
    { q: 1, r: 3, s: -4 },
    { q: 0, r: 4, s: -4 },
    { q: -1, r: 4, s: -3 },
    { q: -2, r: 4, s: -2 },
    { q: -3, r: 4, s: -1 },
    { q: -4, r: 4, s: 0 },
    { q: -4, r: 3, s: 1 },
    { q: -4, r: 2, s: 2 },
    { q: -4, r: 1, s: 3 },
    { q: -4, r: 0, s: 4 },
    { q: -3, r: -1, s: 4 },
    { q: -2, r: -2, s: 4 },
    { q: -1, r: -3, s: 4 },
    { q: 0, r: -4, s: 4 },
    { q: 1, r: -4, s: 3 },
    { q: 2, r: -4, s: 2 },
    { q: 3, r: -4, s: 1 },
    { q: 4, r: -4, s: 0 },
    { q: 4, r: -3, s: -1 },
    { q: 4, r: -2, s: -2 },
    { q: 4, r: -1, s: -3 },
];

// test hex to idx
it("hexToId : test central hex", () => {
    assert.equal(hexToIdx(0, 0, 0), 0);
});

it("hexToId : test first ring", () => {
    for (var i = 0; i < 6; i++) {
        var hex = first_ring[i];
        assert.equal(hexToIdx(hex.q, hex.r, hex.s), i + 1);
    }
});

it("hexToId : test fourth ring", () => {
    for (var i = 0; i < 24; i++) {
        var hex = fourth_ring[i];
        assert.equal(
            hexToIdx(hex.q, hex.r, hex.s),
            i + 37,
            "Error on step i=" + i
        );
    }
});

// test idx to hex
it("idxToHex : test central hex", () => {
    assert.deepEqual(idxToHex(0), { q: 0, r: 0, s: 0 });
});

it("idxToHex : test first ring", () => {
    for (var i = 0; i < 6; i++) {
        var hex = first_ring[i];
        assert.deepEqual(idxToHex(i + 1), hex);
    }
});

it("idxToHex : test fourth ring", () => {
    for (var i = 0; i < 6; i++) {
        var hex = fourth_ring[i];
        assert.deepEqual(idxToHex(i + 37), hex);
    }
});

it("hexStringToIdx", () => {
    assert.equal(hexStringToIdx("<0,0,0>"), 0);
    assert.equal(hexStringToIdx("<1,0,-1>"), 1);
});

it("idxToHexString", () => {
    assert.equal(idxToHexString(0), "<0,0,0>");
});
