#!/usr/bin/env node

const assert = require("assert");

/**
 * Create an OBJ file for an oval table model.
 *
 * Divide into quadrants, with independent UV for each.  Mirror UVs so (0,0) is
 * the center of the table and (1,0) + (0,1) are the edges (clipping where the
 * oval is narrower).
 *
 * The model is centered at the origin in XY, but aligned so the top is at 0.
 */

const yargs = require("yargs");

const argv = yargs
    .option("w", {
        alias: "width",
        describe: "oval width (Y in TTPG space)",
        type: "number",
        demand: true,
    })
    .option("h", {
        alias: "height",
        describe: "oval height (X in TTPG space)",
        type: "number",
        demand: true,
    })
    .option("d", {
        alias: "depth",
        describe: "oval depth (Z in TTPG space)",
        type: "number",
        demand: true,
        default: 3,
    })
    .option("n", {
        alias: "numpoints",
        describe: "divide oval into N points",
        type: "number",
        demand: true,
        default: 64,
    }).argv;

// Round points multiple of 4.
argv.numpoints = Math.ceil(argv.numpoints / 4) * 4;

class ObjOvalUV {
    constructor(params = argv) {
        this._params = params;
    }

    /**
     * Points about the oval.
     *
     * @returns {Array.{Object.{x,y}}}
     */
    getPoints() {
        const n = this._params.numpoints;
        const halfHeight = this._params.height / 2;
        const halfWidth = this._params.width / 2;
        const points = [];
        for (let i = 0; i < n; i++) {
            const phi = (Math.PI * 2 * i) / n;
            const x = Math.sin(phi) * halfWidth;
            const y = Math.cos(phi) * halfHeight;
            points.push({
                x: Math.round(x * 1000) / 1000,
                y: Math.round(y * 1000) / 1000,
            });
        }
        return points;
    }

    toUV(point) {
        assert(typeof point === "object");
        assert(typeof point.x === "number");
        assert(typeof point.y === "number");

        const halfHeight = this._params.height / 2;
        const halfWidth = this._params.width / 2;
        const maxDimension = Math.max(halfHeight, halfWidth);

        // Mirror around origin.
        const u = Math.abs(point.x / maxDimension);
        const v = Math.abs(point.y / maxDimension);

        return { u, v };
    }

    toSideNormal(point) {
        assert(typeof point === "object");
        assert(typeof point.x === "number");
        assert(typeof point.y === "number");

        const length = Math.sqrt(point.x * point.x + point.y * point.y);
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: Math.round((point.x / length) * 1000) / 1000,
            y: Math.round((point.y / length) * 1000) / 1000,
        };
    }

    /**
     * Gets point indices for each arc, followed by -1 (replace with origin).
     */
    getQuadrantPointIndices() {
        const n = this._params.numpoints;
        const indices = Array.from(Array(n).keys());
        const qSize = n / 4;
        const quadrants = [
            indices.slice(0, qSize + 1),
            indices.slice(qSize, qSize * 2 + 1),
            indices.slice(qSize * 2, qSize * 3 + 1),
            [...indices.slice(qSize * 3, qSize * 4), indices[0]],
        ];

        // Add origin marker.
        quadrants.map((quadrant) => {
            quadrant.push(-1);
        });

        return quadrants;
    }

    /**
     * Create a triangle strip for the hull.
     *
     * @param {Array.{number}} pointIndices
     * @param {boolean} isTop
     * @returns {Array.{Object.{a:number,b:number,c:number}}} Zero-based point index
     */
    triangleStrip(pointIndices, isTop) {
        assert(Array.isArray(pointIndices));
        assert(typeof isTop === "boolean");

        const n = pointIndices.length;
        const triangles = [];
        let nextLeft = 0;
        let nextRight = n - 1;
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
                [a, c] = [c, a];
            }
            triangles.push({
                a: pointIndices[a],
                b: pointIndices[b],
                c: pointIndices[c],
            });
        }

        return triangles;
    }

    /**
     * Create side faces.
     * Requires vertices be the top oval immediately followed by the bottom.
     *
     * @param {number} numVertices
     * @returns {Array.{Object.{a:number,b:number,c:number}}} Zero-based point index
     */
    triangulateSides() {
        const n = this._params.numpoints;

        const triangles = [];
        for (let i = 0; i < n; i++) {
            const a = i;
            const b = a + n;
            const d = (i + 1) % n;
            const c = d + n;
            triangles.push({ a, b, c });
            triangles.push({ a: c, b: d, c: a });
        }
        return triangles;
    }

    makeObj() {
        const obj = [
            `# oval ${argv.width}w ${argv.height}h ${argv.depth}d, ${argv.numpoints} points`,
        ];

        // Get the points about the oval.
        const points = this.getPoints();

        // Top + bottom origins.
        obj.push("\n# top/bottom origin");
        obj.push(`v 0 0 0`);
        obj.push(`v 0 ${-this._params.depth} 0`);

        // Ovals (top IMMEDIATELY followed by bottom - needed for sides)
        obj.push("\n# top oval");
        for (const p of points) {
            obj.push(`v ${p.x} 0 ${p.y}`);
        }
        obj.push("\n# bottom oval");
        for (const p of points) {
            obj.push(`v ${p.x} ${-this._params.depth} ${p.y}`);
        }

        // UVs.
        obj.push("\n# origin UV");
        obj.push(`vt 0 0`);
        obj.push("\n# oval UVs");
        for (const p of points) {
            const uv = this.toUV(p);
            obj.push(`vt ${uv.u} ${uv.v}`);
        }

        // Top + bottom normals.
        obj.push("\n# top/bottom normals");
        obj.push(`vn 0 1 0`);
        obj.push(`vn 0 -1 0`);

        obj.push("\n# side normals");
        for (const p of points) {
            const normal = this.toSideNormal(p);
            obj.push(`vn ${normal.x} 0 ${normal.y}`);
        }

        const topOriginVertexIndex = 1; // one based
        const bottomOriginVertexIndex = 2;
        const topOvalVertexOffset = 3; // one based
        const bottomOvalVertexOffset = 3 + points.length;
        const originUvIndex = 1;
        const uvOffset = 2;
        const topNormalIndex = 1;
        const bottomNormalIndex = 2;
        const sideNormalOffset = 3;

        // Top faces.
        obj.push("\n# top faces");
        const quadrants = this.getQuadrantPointIndices();
        for (const quadrant of quadrants) {
            const isTop = true;
            const top = this.triangleStrip(quadrant, isTop);
            for (const triangle of top) {
                const entries = [];
                for (const i of [triangle.a, triangle.b, triangle.c]) {
                    const vertex =
                        i >= 0 ? i + topOvalVertexOffset : topOriginVertexIndex;
                    const uv = i >= 0 ? i + uvOffset : originUvIndex;
                    const normal = topNormalIndex; // use same normal for all
                    entries.push(`${vertex}/${uv}/${normal}`);
                }
                obj.push(`f ${entries.join(" ")}`);
            }
        }

        // Bottom faces.
        obj.push("\n# bottom faces");
        for (const quadrant of quadrants) {
            const isTop = false;
            const top = this.triangleStrip(quadrant, isTop);
            for (const triangle of top) {
                const entries = [];
                for (const i of [triangle.a, triangle.b, triangle.c]) {
                    const vertex =
                        i >= 0
                            ? i + bottomOvalVertexOffset
                            : bottomOriginVertexIndex;
                    const uv = i + uvOffset;
                    const normal = bottomNormalIndex; // use same normal for all
                    entries.push(`${vertex}/${uv}/${normal}`);
                }
                obj.push(`f ${entries.join(" ")}`);
            }
        }

        // Sides (normals are already given as up, down, then per-point sides).
        obj.push("\n# side faces");
        const sides = this.triangulateSides();
        for (const triangle of sides) {
            const entries = [];
            for (const i of [triangle.a, triangle.b, triangle.c]) {
                const vertex = i + topOvalVertexOffset;
                const uv = (i % points.length) + uvOffset;
                const normal = (i % points.length) + sideNormalOffset;
                entries.push(`${vertex}/${uv}/${normal}`);
            }
            obj.push(`f ${entries.join(" ")}`);
        }

        return obj.join("\n");
    }
}

const objOval = new ObjOvalUV(argv);
//const points = objOval.getPoints();
//console.log("\n---\nPoints:");
//console.log(JSON.stringify(points));

//const quadrants = objOval.getQuadrantPointIndices();
//console.log("\n---Quadrants:");
//console.log(JSON.stringify(quadrants));

//const uvs = points.map((p) => objOval.toUV(p));
//console.log("\n---UVs:");
//console.log(JSON.stringify(uvs));

//const top = objOval.triangleStrip([1, 2, 3, 4, 5, 6, 7, 8, -1], true);
//console.log(`\n---\nTriangles:`);
//console.log(JSON.stringify(top));

//const sides = objOval.triangulateSides(argv.numpoints);
//console.log("\n---\nSides triangles:");
//console.log(JSON.stringify(sides));

const obj = objOval.makeObj();
console.log(obj);
