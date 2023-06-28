/**
 * Given an OBJ file generate a XY planer outline for viewing from above.
 *
 * Helpful libraries:
 * https://www.npmjs.com/package/convex-hull
 * https://www.npmjs.com/package/simplify-js
 * https://www.npmjs.com/package/polygon-offset # bad, use the TI4 library polygon
 */

const assert = require("assert");
const convexHull = require("monotone-chain-convex-hull").default;
const fs = require("fs-extra");
const readline = require("readline");
const simplify = require("simplify-js");

class UnitOutline {
    constructor() {}

    static async getVertices(objFilename) {
        const fileStream = fs.createReadStream(objFilename);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const vertices = [];
        for await (const line of rl) {
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

        console.log(`UnitOutline.getVertices: |vertices|=${vertices.length}`);
        return vertices;
    }

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

        console.log(
            `UnitOutline.getConvexHullPolygon: |input|=${vertices.length} |hull|=${hullPolygon.length}`
        );
        return hullPolygon;
    }

    static simplifyPolygon(polygon, tolerance) {
        assert(Array.isArray(polygon));
        polygon.forEach((v) => {
            assert(typeof v.x === "number");
            assert(typeof v.y === "number");
        });
        assert(typeof tolerance === "number");

        const highQuality = true;
        const simplified = simplify(polygon, tolerance, highQuality);

        console.log(
            `UnitOutline.simplifyPolygon: |input|=${polygon.length} |simplified|=${simplified.length}`
        );
        return simplified;
    }

    static outsetPolygon(polygon, distance) {
        assert(Array.isArray(polygon));
        polygon.forEach((v) => {
            assert(typeof v.x === "number");
            assert(typeof v.y === "number");
        });
        assert(typeof distance === "number");

        // polygon-offset does not work well.
        // Instead, get a set of scatter points at each vertex and convex hull.
        const dAngle = Math.sqrt(0.5) * distance;
        const outlinePoints = [];
        polygon.forEach((p) => {
            outlinePoints.push({ x: p.x - distance, y: p.y });
            outlinePoints.push({ x: p.x + distance, y: p.y });
            outlinePoints.push({ x: p.x, y: p.y - distance });
            outlinePoints.push({ x: p.x, y: p.y + distance });
            outlinePoints.push({ x: p.x - dAngle, y: p.y - dAngle });
            outlinePoints.push({ x: p.x - dAngle, y: p.y + dAngle });
            outlinePoints.push({ x: p.x + dAngle, y: p.y - dAngle });
            outlinePoints.push({ x: p.x + dAngle, y: p.y + dAngle });
        });
        const outset = UnitOutline.getConvexHullPolygon(outlinePoints);

        console.log(
            `UnitOutline.outsetPolygon: |input|=${polygon.length} |outset|=${outset.length}`
        );
        return outset;
    }

    static triangulate(polygon, z = 0) {
        // Polygon is a convex hull so fan triangluation works.
        const lines = [];
        for (const p of polygon) {
            lines.push(`v ${p.x} ${z} ${p.y}`);
        }
        for (let i = 3; i <= polygon.length; i++) {
            lines.push(`f 1// ${i - 1}// ${i}//`);
        }
        const bytes = lines.join("\n");
        console.log(bytes);
    }

    static saveeObj(polygon, triangles, outlineObjFilename) {}
}

module.exports = { UnitOutline };
