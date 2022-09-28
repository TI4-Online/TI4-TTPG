/**
 * Given an OBJ file generate convex-hull collider based on a XY planer outline.
 */

const assert = require("assert");
const convexHull = require("monotone-chain-convex-hull");
const fs = require("fs-extra");
const simplify = require("simplify-js");
const { SoftwareRenderer } = require("./software-renderer");

class ConvexCollider {
    /**
     * Read a file.
     *
     * @param {string} filename
     * @returns {Array.{string}} - file contents as separate lines
     */
    static readFileLines(filename) {
        assert(typeof filename === "string");
        return fs.readFileSync(filename, "utf-8").split(/\r?\n/);
    }

    static writeFileLines(filename, lines) {
        assert(typeof filename === "string");
        assert(Array.isArray(lines));
        const contents = lines.join("\n");
        fs.writeFileSync(filename, contents);
    }

    /**
     * Extract vertices from OBJ file lines.
     *
     * @param {Array.{string}} objFileLines
     * @returns {Array.{Object.{x,y,z}}}
     */
    static parseVertices(objFileLines) {
        assert(Array.isArray(objFileLines));

        const vertices = [];
        for (const line of objFileLines) {
            const lineItems = line.replace(/\s\s+/g, " ").trim().split(" ");
            if (lineItems[0].toLocaleLowerCase() === "v") {
                const x =
                    lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
                const y =
                    lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
                const z =
                    lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;
                // We want the XZ values, but as XY.
                vertices.push({ x, y: z, z: y });
            }
        }
        return vertices;
    }

    /**
     * Get Bounding box.
     *
     * @param {Array.{Object.{x,y,z}}} vertices
     * @returns {Object.{min:Object{x,y,z},max:Object.{x,y,z}}}
     */
    static getBoundingBox(vertices) {
        assert(Array.isArray(vertices));
        vertices.forEach((v) => {
            assert(typeof v.x === "number");
            assert(typeof v.y === "number");
            assert(typeof v.z === "number");
        });

        const bb = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
        vertices.forEach((v) => {
            bb.min.x = Math.min(bb.min.x, v.x);
            bb.min.y = Math.min(bb.min.y, v.y);
            bb.min.z = Math.min(bb.min.z, v.z);
            bb.max.x = Math.max(bb.max.x, v.x);
            bb.max.y = Math.max(bb.max.y, v.y);
            bb.max.z = Math.max(bb.max.z, v.z);
        });
        return bb;
    }

    /**
     * Compute XY convex hull.
     *
     * @param {Array.{Object.{x,y,z}}} vertices
     * @returns {Array.{Object.{x,y}}}
     */
    static getConvexHullPolygon(vertices) {
        assert(Array.isArray(vertices));
        vertices.forEach((v) => {
            assert(typeof v.x === "number");
            assert(typeof v.y === "number");
        });

        const xyPoints = vertices.map((v) => {
            return [v.x, v.y];
        });
        const hull = convexHull(xyPoints);

        const hullPolygon = hull.map((p) => {
            return { x: p[0], y: p[1] };
        });

        return hullPolygon;
    }

    /**
     * Remove points to create a similar (but fewer point) polygon.
     *
     * Tolerance is not well defined.  The library defaults to "1" but
     * that cleaves too much.
     *
     * @param {Array.{Object.{x,y}}} polygon
     * @param {number} tolerance
     * @returns {Array.{Object.{x,y}}}
     */
    static simplifyPolygon(polygon, tolerance = 0.2) {
        assert(Array.isArray(polygon));
        polygon.forEach((v) => {
            assert(typeof v.x === "number");
            assert(typeof v.y === "number");
        });
        assert(typeof tolerance === "number");

        const highQuality = true;
        const simplified = simplify(polygon, tolerance, highQuality);

        return simplified;
    }

    /**
     * Create a triangle strip for the hull.
     *
     * @param {number} numVertices
     * @param {boolean} isTop
     * @returns {Array.{string}} Obj file lines
     */
    static triangulateHull(numVertices, isTop) {
        assert(typeof numVertices === "number");
        assert(typeof isTop === "boolean");

        const lines = [];
        let nextLeft = 1;
        let nextRight = numVertices;
        let goLeft = true;

        while (nextLeft + 1 < nextRight) {
            let a, b, c;
            if (goLeft) {
                a = nextLeft;
                b = nextLeft + 1;
                c = nextRight;
                nextLeft = b;
                goLeft = false;
            } else {
                a = nextLeft;
                b = nextRight - 1;
                c = nextRight;
                nextRight = b;
                goLeft = true;
            }
            if (!isTop) {
                a += numVertices;
                b += numVertices;
                c += numVertices;
                [a, c] = [c, a];
            }
            lines.push(["f", `${a}//`, `${b}//`, `${c}//`].join(" "));
        }

        return lines;
    }

    /**
     * Create side faces.  Requires the first set of veritices be the top and
     * the second be the bottom.
     *
     * @param {number} numVertices
     * @returns {Array.{string}} Obj file lines
     */
    static triangulateSides(numVertices) {
        assert(typeof numVertices === "number");

        const lines = [];
        for (let i = 0; i < numVertices; i++) {
            const a = i + 1; // one based vertex index
            const b = a + numVertices;
            const d = ((i + 1) % numVertices) + 1; // same
            const c = d + numVertices;
            lines.push(["f", `${a}//`, `${b}//`, `${c}//`].join(" "));
            lines.push(["f", `${c}//`, `${d}//`, `${a}//`].join(" "));
        }
        return lines;
    }

    /**
     * Create full OBJ volume, triangulating top/bottom/sides.
     *
     * @param {Array.{Object.{x,y}} polygon
     * @param {number} minZ
     * @param {number} maxZ
     * @return {Array.{string}} - OBJ file lines
     */
    static hullVolume(polygon, minZ, maxZ) {
        assert(Array.isArray(polygon));
        assert(typeof minZ === "number");
        assert(typeof maxZ === "number");
        assert(minZ < maxZ);

        const n = polygon.length;
        const lines = [];

        lines.push("# Top");
        for (const p of polygon) {
            lines.push(`v ${p.x} ${maxZ} ${p.y}`);
        }

        lines.push("");
        lines.push("# Bottom");
        for (const p of polygon) {
            lines.push(`v ${p.x} ${minZ} ${p.y}`);
        }

        lines.push("");
        lines.push("# Top faces");
        lines.push(...ConvexCollider.triangulateHull(n, true));

        lines.push("");
        lines.push("# Bottom faces");
        lines.push(...ConvexCollider.triangulateHull(n, false));

        lines.push("");
        lines.push("# Side faces");
        lines.push(...ConvexCollider.triangulateSides(n));

        return lines;
    }

    static processUsingSoftwareRenderer(srcFile, dstFile, options) {
        console.log(`processing "${srcFile}"`);

        // Get bounding box from mesh.
        let lines = ConvexCollider.readFileLines(srcFile);
        let vertices = ConvexCollider.parseVertices(lines);
        const bb = ConvexCollider.getBoundingBox(vertices);

        // Draw using software renderer and get pixel corners.
        // This does a nice job of "voxel"izing the model.
        const softwareRenderer = new SoftwareRenderer()
            .load(srcFile)
            .verifyModel()
            .topDown();

        if (options) {
            softwareRenderer.applyOptions(options);
        }

        const scale = softwareRenderer.getScaleForSize(15);
        vertices = softwareRenderer
            .scale(scale)
            .draw()
            .getRasterAsModelSpacePoints(1 / scale);

        let hull = ConvexCollider.getConvexHullPolygon(vertices);
        console.log(`|hull|=${hull.length}`);

        hull = ConvexCollider.simplifyPolygon(hull, 0.1);
        console.log(`|simplified|=${hull.length}`);

        lines = ConvexCollider.hullVolume(hull, bb.min.z, bb.max.z);
        ConvexCollider.writeFileLines(dstFile, lines);
    }
}

module.exports = { ConvexCollider };
