require("regenerator-runtime"); // for async tests
const assert = require("assert");
const { UnitOutline } = require("./unit-outlines");

it("constructor", () => {
    new UnitOutline();
});

it("getVertices", async () => {
    const objFilename =
        __dirname + "/../../assets/Models/units/base/dreadnought.obj";
    const vertices = await UnitOutline.getVertices(objFilename);
    assert(Array.isArray(vertices));
    vertices.forEach((v) => {
        assert(typeof v.x === "number");
        assert(typeof v.y === "number");
    });
});

it("getConvexHullPolygon", () => {
    const vertices = [
        { x: 0, y: 0 },
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
    ];
    const hull = UnitOutline.getConvexHullPolygon(vertices);
    assert.deepEqual(hull, [
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
    ]);
});

it("simplifyPolygon", () => {
    const polygon = [
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 0.9, y: 0.9 },
        { x: 1, y: 1 },
        { x: 1.1, y: 1.1 },
    ];
    const tolerance = 0.15;
    const simplified = UnitOutline.simplifyPolygon(polygon, tolerance);
    assert.deepEqual(simplified, [
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 0.9, y: 0.9 },
        { x: 1.1, y: 1.1 },
    ]);
});

it("outsetPolygon", () => {
    const polygon = [
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
    ];
    const distance = 0.1;
    const outset = UnitOutline.outsetPolygon(polygon, distance);
    assert.deepEqual(outset, [
        { x: -1.1, y: -1 },
        { x: -1.1, y: 1 },
        { x: -1.0707106781186548, y: 1.0707106781186548 },
        { x: -1, y: 1.1 },
        { x: 1, y: 1.1 },
        { x: 1.0707106781186548, y: 1.0707106781186548 },
        { x: 1.1, y: 1 },
        { x: 1.1, y: -1 },
        { x: 1.0707106781186548, y: -1.0707106781186548 },
        { x: 1, y: -1.1 },
        { x: -1, y: -1.1 },
        { x: -1.0707106781186548, y: -1.0707106781186548 },
    ]);
});

it("full process", async () => {
    const objFilename =
        __dirname + "/../../assets/Models/units/base/dreadnought.obj";
    const vertices = await UnitOutline.getVertices(objFilename);
    let z = 0;
    vertices.forEach((v) => (z = Math.min(z, v.z)));
    z += 0.05;

    const hull = UnitOutline.getConvexHullPolygon(vertices);
    const tolerance = 0.01;
    const simplified = UnitOutline.simplifyPolygon(hull, tolerance);
    const distance = 0.3;
    const outset = UnitOutline.outsetPolygon(simplified, distance);
    const triangles = UnitOutline.triangulate(outset, z);
    console.log(triangles);

    let min = 0;
    let max = 0;
    outset.forEach((p) => {
        min = Math.min(min, p.x);
        min = Math.min(min, p.y);
        max = Math.max(max, p.x);
        max = Math.max(max, p.y);
    });
    const range = max - min;

    const hullUvs = hull.map((p) => {
        return { u: (p.x - min) / range, v: (p.y - min) / range };
    });
    const simplifiedUVs = outset.map((p) => {
        return { u: (p.x - min) / range, v: (p.y - min) / range };
    });
    const outsetUVs = outset.map((p) => {
        return { u: (p.x - min) / range, v: (p.y - min) / range };
    });

    const x1 = hullUvs.map((uv) => Math.floor(uv.u * 10000) / 100 + 1);
    const y1 = hullUvs.map((uv) => Math.floor(uv.v * 10000) / 100 + 1);
    const x2 = simplifiedUVs.map((uv) => Math.floor(uv.u * 10000) / 100 + 1);
    const y2 = simplifiedUVs.map((uv) => Math.floor(uv.v * 10000) / 100 + 1);
    const x3 = outsetUVs.map((uv) => Math.floor(uv.u * 10000) / 100 + 1);
    const y3 = outsetUVs.map((uv) => Math.floor(uv.v * 10000) / 100 + 1);
    const url = `https://image-charts.com/chart?chs=512x512&cht=lxy&chd=t:${x1}|${y1}|${x2}|${y2}|${x3}|${y3}`;
    console.log(url);
});
