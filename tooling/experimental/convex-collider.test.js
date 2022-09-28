require("regenerator-runtime"); // for async tests
const assert = require("assert");
const { ConvexCollider } = require("./convex-collider");

it("constructor", () => {
    new ConvexCollider();
});

it("readFileLines / parseVertices", () => {
    const objFilename =
        __dirname + "/../../assets/Models/units/base/dreadnought.obj";
    const lines = ConvexCollider.readFileLines(objFilename);
    const vertices = ConvexCollider.parseVertices(lines);
    assert(Array.isArray(vertices));
    vertices.forEach((v) => {
        assert(typeof v.x === "number");
        assert(typeof v.y === "number");
        assert(typeof v.z === "number");
    });
});

it("getBoundingBox", () => {
    const vertices = [
        { x: 1, y: 2, z: 3 },
        { x: -4, y: -5, z: -6 },
    ];
    const bb = ConvexCollider.getBoundingBox(vertices);
    assert.deepEqual(bb, {
        max: { x: 1, y: 2, z: 3 },
        min: { x: -4, y: -5, z: -6 },
    });
});

it("getConvexHullPolygon", () => {
    const vertices = [
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
    ];
    const hull = ConvexCollider.getConvexHullPolygon(vertices);
    assert.equal(hull.length, 4);
    const hullStrs = hull.map((vertex) => {
        return `(${vertex.x},${vertex.y})`;
    });
    const hullStr = hullStrs.join(" ");
    assert.equal(hullStr, "(-1,-1) (-1,1) (1,1) (1,-1)");
});

it("triangulateHull top", () => {
    const objLines = ConvexCollider.triangulateHull(7, true);
    assert.deepEqual(objLines, [
        "f 1// 2// 7//",
        "f 2// 6// 7//",
        "f 2// 3// 6//",
        "f 3// 5// 6//",
        "f 3// 4// 5//",
    ]);
});

it("triangulateHull bottom", () => {
    const objLines = ConvexCollider.triangulateHull(7, false);
    assert.deepEqual(objLines, [
        "f 14// 9// 8//",
        "f 14// 13// 9//",
        "f 13// 10// 9//",
        "f 13// 12// 10//",
        "f 12// 11// 10//",
    ]);
});

it("triangulateSides", () => {
    const objLines = ConvexCollider.triangulateSides(3);
    assert.deepEqual(objLines, [
        "f 1// 4// 5//",
        "f 5// 2// 1//",
        "f 2// 5// 6//",
        "f 6// 3// 2//",
        "f 3// 6// 4//",
        "f 4// 1// 3//",
    ]);
});

it("hullVolume", () => {
    const hull = [
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
    ];
    const objLines = ConvexCollider.hullVolume(hull, -1, 1);
    assert.deepEqual(objLines, [
        "# Top",
        "v -1 1 -1",
        "v -1 1 1",
        "v 1 1 1",
        "v 1 1 -1",
        "",
        "# Bottom",
        "v -1 -1 -1",
        "v -1 -1 1",
        "v 1 -1 1",
        "v 1 -1 -1",
        "",
        "# Top faces",
        "f 1// 2// 4//",
        "f 2// 3// 4//",
        "",
        "# Bottom faces",
        "f 8// 6// 5//",
        "f 8// 7// 6//",
        "",
        "# Side faces",
        "f 1// 5// 6//",
        "f 6// 2// 1//",
        "f 2// 6// 7//",
        "f 7// 3// 2//",
        "f 3// 7// 8//",
        "f 8// 4// 3//",
        "f 4// 8// 5//",
        "f 5// 1// 4//",
    ]);
});
