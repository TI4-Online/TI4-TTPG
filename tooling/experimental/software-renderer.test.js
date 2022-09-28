require("regenerator-runtime"); // for async tests
const assert = require("assert");
const { SoftwareRenderer } = require("./software-renderer");

it("constructor", () => {
    new SoftwareRenderer();
});

it("load", () => {
    const objFilename =
        __dirname + "/../../assets/Models/units/base/dreadnought.obj";

    const softwareRenderer = new SoftwareRenderer()
        .load(objFilename)
        .verifyModel();
    assert(softwareRenderer instanceof SoftwareRenderer);
});

it("raster scaled", () => {
    const objFilename =
        __dirname + "/../../assets/Models/units/base/dreadnought.obj";

    const softwareRenderer = new SoftwareRenderer()
        .load(objFilename)
        .verifyModel()
        .topDown();
    assert(softwareRenderer instanceof SoftwareRenderer);

    const pixelSize = 15;
    const scale = softwareRenderer.getScaleForSize(pixelSize);
    softwareRenderer.scale(scale);
    softwareRenderer.getScaleForSize(pixelSize - 1);

    const raster = softwareRenderer.draw().getRaster();
    assert(Array.isArray(raster));

    let visual = [];
    for (let x = 0; x < pixelSize; x++) {
        visual[x] = [];
        for (let y = 0; y < pixelSize; y++) {
            visual[x][y] = ".";
        }
    }
    for (const point of raster) {
        //console.log(`raster <${point.x},${point.y}>`);
        const x = point.x + Math.floor(pixelSize / 2);
        const y = point.y + Math.floor(pixelSize / 2);
        assert(typeof x === "number");
        assert(typeof y === "number");
        if (x >= pixelSize || y >= pixelSize) {
            continue;
        }
        visual[x][y] = "X";
    }
    visual = visual.map((line) => line.join(""));
    assert.deepEqual(visual, [
        ".....XXXXX.....",
        "....XXXXXXX....",
        "....XXXXXXX....",
        ".....XXXXX.....",
        "......XXX......",
        "......XXX......",
        ".....XXXXX.....",
        ".....XXXXX.....",
        ".....XXXXX.....",
        ".....XXXXX.....",
        "......XXX......",
        "......XXX......",
        "......XXX......",
        ".......X.......",
        ".......X.......",
    ]);
});
