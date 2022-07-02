"use strict";
const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const TEST = path.normalize("assets/Models/units/base/dreadnought.obj");
//const TEST = path.normalize("assets/Models/units/base/fighter.obj");
const TEST_OUT = "test.png";

/**
 * Generate an emissive map of inset lines about a unit model.
 * @author Darrell
 *
 * @see https://github.com/rastapasta/points-in-triangle
 * https://stackoverflow.com/questions/41661751/three-js-calculate-3d-coordinates-from-uv-coordinates
 * https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage
// http://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
 * https://github.com/ccajas/JS-TinyRenderer/
 */

class SoftwareRenderer {
    constructor() {
        this._v = [];
        this._vn = [];
        this._vt = [];
        this._f = [];

        // Pixel <x,y> to uv, other data.
        this._buf = {};
    }

    load(filename) {
        console.log(`${Date.now()} load "${filename}"`);
        const lines = fs.readFileSync(filename, "utf-8").split(/\r?\n/);
        this._loadFromLines(lines);
        return this;
    }

    _loadFromLines(objLines) {
        assert(Array.isArray(objLines));

        for (const objLine of objLines) {
            const parts = objLine.split(" ").filter((s) => s.length > 0);
            const key = parts.shift();
            if (key === "v") {
                assert.equal(parts.length, 3);
                this._v.push([
                    Number.parseFloat(parts[0]),
                    Number.parseFloat(parts[1]),
                    Number.parseFloat(parts[2]),
                ]);
            } else if (key === "vn") {
                assert.equal(parts.length, 3);
                this._vn.push([
                    Number.parseFloat(parts[0]),
                    Number.parseFloat(parts[1]),
                    Number.parseFloat(parts[2]),
                ]);
            } else if (key === "vt") {
                assert(parts.length >= 2); // third "w" value optional
                this._vt.push([
                    Number.parseFloat(parts[0]),
                    Number.parseFloat(parts[1]),
                ]);
            } else if (key === "f") {
                assert.equal(parts.length, 3); // triangles
                this._f.push(
                    parts.map((part) => {
                        const faceParts = part.split("/");
                        assert(faceParts.length === 3); // require all
                        return {
                            vIdx: Number.parseInt(faceParts[0]) - 1, // make zero based
                            vtIdx: Number.parseInt(faceParts[1]) - 1,
                            vnIdx: Number.parseInt(faceParts[2]) - 1,
                        };
                    })
                );
            }
        }
        return this;
    }

    verifyModel() {
        console.log(`${Date.now()} verifyModel`);

        // All V are numbers.
        for (const [a, b, c] of this._v) {
            assert(typeof a === "number");
            assert(typeof b === "number");
            assert(typeof c === "number");
        }

        // All VN are numbers.
        for (const [a, b, c] of this._vn) {
            assert(typeof a === "number");
            assert(typeof b === "number");
            assert(typeof c === "number");
        }

        // All VT are numbers in [0:1] range.
        for (const [u, v] of this._vt) {
            assert(typeof u === "number");
            assert(typeof v === "number");
            assert(0 <= u && u <= 1);
            assert(0 <= v && v <= 1);
        }

        // All F are numbers, and a valid index.
        for (const face of this._f) {
            for (const entry of face) {
                assert(typeof entry.vIdx === "number");
                assert(typeof entry.vtIdx === "number");
                assert(typeof entry.vnIdx === "number");
                assert(this._v[entry.vIdx]);
                assert(this._vt[entry.vtIdx]);
                assert(this._vn[entry.vnIdx]);
            }
        }
        return this;
    }

    /**
     * Scale the model.
     *
     * @param {number} value
     * @returns self, for chaining
     */
    scale(value) {
        assert(typeof value === "number");
        console.log(`${Date.now()} scale ${value}`);

        for (const v of this._v) {
            v[0] = v[0] * value;
            v[1] = v[1] * value;
            v[2] = v[2] * value;
        }
        return this;
    }

    /**
     * "Rotate" the model, flipping Y and Z values b/c renderer is in XY space.
     *
     * @returns self, for chaining
     */
    topDown() {
        console.log(`${Date.now()} topDown`);

        for (const v of this._v) {
            const [x, y, z] = v;
            assert(typeof x === "number");
            assert(typeof y === "number");
            assert(typeof z === "number");
            v[1] = z;
            v[2] = y;
        }
        return this;
    }

    draw() {
        console.log(`${Date.now()} draw`);
        this._buf = {};
        for (const f of this._f) {
            this._drawTriangle(f);
        }
        return this;
    }

    _drawTriangle(face) {
        assert(Array.isArray(face));

        const pts = [
            this._v[face[0].vIdx],
            this._v[face[1].vIdx],
            this._v[face[2].vIdx],
        ];
        const uvs = [
            this._vt[face[0].vtIdx],
            this._vt[face[1].vtIdx],
            this._vt[face[2].vtIdx],
        ];
        const norms = [
            this._vn[face[0].vnIdx],
            this._vn[face[1].vnIdx],
            this._vn[face[2].vnIdx],
        ];

        // Create bounding box
        const boxMin = [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
            boxMax = [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];

        // Find X and Y dimensions for each
        for (let i = 0; i < pts.length; i++) {
            for (let j = 0; j < 2; j++) {
                boxMin[j] = Math.min(pts[i][j], boxMin[j]);
                boxMax[j] = Math.max(pts[i][j], boxMax[j]);
            }
        }

        boxMin[0] = Math.floor(boxMin[0]);
        boxMin[1] = Math.floor(boxMin[1]);
        boxMax[0] = Math.floor(boxMax[0]);
        boxMax[1] = Math.floor(boxMax[1]);

        // Triangle setup
        const a01 = pts[0][1] - pts[1][1];
        const b01 = pts[1][0] - pts[0][0];
        const a12 = pts[1][1] - pts[2][1];
        const b12 = pts[2][0] - pts[1][0];
        const a20 = pts[2][1] - pts[0][1];
        const b20 = pts[0][0] - pts[2][0];

        const c01 = pts[1][1] - pts[0][1];
        const c12 = pts[2][1] - pts[1][1];

        // Parallelogram area from determinant (inverse)
        const denominator = b01 * c12 - b12 * c01;
        if (denominator === 0) {
            return; // empty triangle
        }
        const area2inv = 1 / denominator;

        // Get orientation to see where the triangle is facing
        let edge_w0 = this._orient2d(pts[1], pts[2], boxMin);
        let edge_w1 = this._orient2d(pts[2], pts[0], boxMin);
        let edge_w2 = this._orient2d(pts[0], pts[1], boxMin);

        let bc = [];

        for (let py = boxMin[1]; py++ <= boxMax[1]; ) {
            // Coordinates at start of row
            let w = [edge_w0, edge_w1, edge_w2];

            for (let px = boxMin[0]; px++ <= boxMax[0]; ) {
                // Check if pixel is outsde of barycentric coords.
                // Ignore triangle winding, render both sides.
                const isTop = w[0] >= 0 && w[1] >= 0 && w[2] >= 0;
                const isBottom = w[0] <= 0 && w[1] <= 0 && w[2] <= 0;

                if (isTop || isBottom) {
                    // Get normalized barycentric coordinates
                    bc[0] = w[0] * area2inv;
                    bc[1] = w[1] * area2inv;
                    bc[2] = w[2] * area2inv;

                    // Get pixel depth

                    // z buffer discard would go here if used.
                    // for (let i = 0, z = 0; i < 3; ) z += pts[i][2] * bc[i++];
                    // "if zbuf[index] < z continue"

                    // Calculate tex and normal coords
                    let uv = [];
                    uv[0] =
                        bc[0] * uvs[0][0] +
                        bc[1] * uvs[1][0] +
                        bc[2] * uvs[2][0];
                    uv[1] =
                        bc[0] * uvs[0][1] +
                        bc[1] * uvs[1][1] +
                        bc[2] * uvs[2][1];

                    const nx =
                        bc[0] * norms[0][0] +
                        bc[1] * norms[1][0] +
                        bc[2] * norms[2][0];
                    const ny =
                        bc[0] * norms[0][1] +
                        bc[1] * norms[1][1] +
                        bc[2] * norms[2][1];
                    const nz =
                        bc[0] * norms[0][2] +
                        bc[1] * norms[1][2] +
                        bc[2] * norms[2][2];

                    // Watch for wacky UVs, allow a little torance for pixel size overflow.
                    if (
                        uv[0] < -0.1 ||
                        uv[0] > 1.1 ||
                        uv[1] < -0.1 ||
                        uv[1] > 1.1
                    ) {
                        return; // skip this point
                    }

                    // Clamp for "almost legal" values.
                    uv[0] = Math.max(uv[0], 0);
                    uv[0] = Math.min(uv[0], 1);
                    uv[1] = Math.max(uv[1], 0);
                    uv[1] = Math.min(uv[1], 1);

                    // Reject if normal not up/down?

                    const key = this._pixelKey(px, py);
                    let entry = this._buf[key];
                    if (!entry) {
                        entry = {
                            x: px,
                            y: py,
                            normals: [],
                            uvs: [],
                        };
                        this._buf[key] = entry;
                    }
                    entry.normals.push([nx, ny, nz]);
                    entry.uvs.push(uv);
                }

                // Step right
                w[0] += a12;
                w[1] += a20;
                w[2] += a01;
            }

            // One row step
            edge_w0 += b12;
            edge_w1 += b20;
            edge_w2 += b01;
        }
        return this;
    }

    _orient2d(p1, p2, b) {
        return (
            (p2[0] - p1[0]) * (b[1] - p1[1]) - (p2[1] - p1[1]) * (b[0] - p1[0])
        );
    }

    _pixelKey(x, y) {
        assert(Number.isInteger(x));
        assert(Number.isInteger(y));
        return `<${x},${y}>`;
    }

    floodDistanceToEdge(maxIterations = 1000) {
        console.log(`${Date.now()} floodDistanceToEdge ${maxIterations}`);

        // Start by assigning pixels on the border.
        for (const entry of Object.values(this._buf)) {
            const left = this._buf[this._pixelKey(entry.x - 1, entry.y)];
            const top = this._buf[this._pixelKey(entry.x, entry.y - 1)];
            const right = this._buf[this._pixelKey(entry.x + 1, entry.y)];
            const bottom = this._buf[this._pixelKey(entry.x, entry.y + 1)];
            if (!left || !top || !right || !bottom) {
                // Edge pixel (at least one neighbor pixel not rendered).
                entry.flood = 1;
            } else {
                // Internal pixel.
                entry.flood = Number.MAX_SAFE_INTEGER;
            }
        }

        // Now flood.
        let active = true;
        let floodIterations = 0;
        while (active && floodIterations <= maxIterations) {
            floodIterations++;
            active = false;
            for (const entry of Object.values(this._buf)) {
                const left = this._buf[this._pixelKey(entry.x - 1, entry.y)];
                const top = this._buf[this._pixelKey(entry.x, entry.y - 1)];
                const right = this._buf[this._pixelKey(entry.x + 1, entry.y)];
                const bottom = this._buf[this._pixelKey(entry.x, entry.y + 1)];

                if (left && left.flood + 1 < entry.flood) {
                    entry.flood = left.flood + 1;
                    active = true;
                }
                if (top && top.flood + 1 < entry.flood) {
                    entry.flood = top.flood + 1;
                    active = true;
                }
                if (right && right.flood + 1 < entry.flood) {
                    entry.flood = right.flood + 1;
                    active = true;
                }
                if (bottom && bottom.flood + 1 < entry.flood) {
                    entry.flood = bottom.flood + 1;
                    active = true;
                }
            }
        }
        console.log(`floodDistanceToEdge: ${floodIterations} iterations`);
        return this;
    }

    /**
     * Mark pixels at this distance from edge.  Flood first!
     *
     * @param {number} inset - distance to edge
     * @param {number} width - additional inset
     * @returns
     */
    insetBorder(inset, width) {
        assert(typeof inset === "number");
        assert(typeof width === "number");
        console.log(`${Date.now()} insetBorder ${inset} ${width}`);

        for (const entry of Object.values(this._buf)) {
            if (entry.flood >= inset && entry.flood <= inset + width) {
                entry.border = true;
            }
        }

        return this;
    }

    printUvRaster() {
        console.log(`${Date.now()} printUvRaster`);
        let raster = [];
        for (let u = 0; u < 100; u++) {
            raster[u] = [];
            for (let v = 0; v < 100; v++) {
                raster[u][v] = " ";
            }
        }
        for (const entry of Object.values(this._buf)) {
            for (const uv of entry.uvs) {
                const u = Math.floor(99.999 * uv[0]);
                const v = 99 - Math.floor(99.999 * uv[1]);
                const line = raster[v];
                if (!line) {
                    continue;
                }
                line[u] = entry.border ? "X" : ".";
            }
        }
        raster = raster
            .map((x) => {
                return x.join("");
            })
            .join("\n");
        console.log(raster);
        return this;
    }

    printXyRaster() {
        console.log(`${Date.now()} printXyRaster`);
        let raster = [];
        for (let x = 0; x < 100; x++) {
            raster[x] = [];
            for (let y = 0; y < 100; y++) {
                raster[x][y] = " ";
            }
        }

        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        for (const entry of Object.values(this._buf)) {
            minX = Math.min(minX, entry.x);
            maxX = Math.max(maxX, entry.x);
            minY = Math.min(minY, entry.y);
            maxY = Math.max(maxY, entry.y);
        }
        const dX = maxX - minX;
        const dY = maxY - minY;
        console.log(`x:${minX}/${maxX} -> ${dX}, y:${minY}/${maxY} -> ${dY}`);

        for (const entry of Object.values(this._buf)) {
            const x = Math.floor(((entry.x - minX) * 99.999) / dX);
            const y = Math.floor(((entry.y - minY) * 99.999) / dY);
            //console.log(`${entry.x},${entry.y} => ${x},${y}`);
            const line = raster[x];
            if (!line) {
                throw new Error(`no line: ${entry.x},${entry.y} => ${x},${y}`);
            }

            let output = ".";
            if (entry.flood && entry.flood < 10) {
                //output = String(entry.flood);
            }
            if (entry.border) {
                output = "X";
            }
            // Always keep the "border" value when scaling.
            if (line[y] !== "X") {
                line[y] = output;
            }
        }

        raster = raster
            .map((x) => {
                return x.join("");
            })
            .join("\n");
        console.log(raster);
        return this;
    }

    async writeBorderUv(filename, size) {
        console.log(`${Date.now()} writeBorderUv "${filename}" ${size}`);

        const config = {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 255 },
        };
        const data = await sharp({
            create: config,
        })
            .raw()
            .toBuffer();
        const pixelArray = new Uint8ClampedArray(data.buffer); // RGBA

        for (const entry of Object.values(this._buf)) {
            if (!entry.border) {
                continue;
            }
            for (const uv of entry.uvs) {
                const u = Math.min(Math.floor(size * uv[0]), size);
                let v = Math.min(Math.floor(size * uv[1]), size);
                v = size - 1 - v; // flip
                const index = v * size + u;
                const offset = index * 4;
                pixelArray[offset] = 255;
                pixelArray[offset + 1] = 255;
                pixelArray[offset + 2] = 255;
                pixelArray[offset + 3] = 1;
            }
        }

        await sharp(pixelArray, { raw: config })
            .blur(1)
            .toFile(filename, (err) => {
                console.log(err);
            });
    }
}

new SoftwareRenderer()
    .load(TEST)
    .verifyModel()
    .scale(400)
    .topDown()
    .draw()
    .floodDistanceToEdge(50)
    .insetBorder(28, 14)
    .printUvRaster()
    .printXyRaster()
    .writeBorderUv(TEST_OUT, 1024);
