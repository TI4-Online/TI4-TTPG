const assert = require("../wrapper/assert-wrapper");
const { Vector } = require("../wrapper/api");
const { world, Color } = require("../wrapper/api");

/**
 * Manage a polygon in the XY plane.
 */
class Polygon {
    constructor(points) {
        assert(typeof points == "object");
        points.forEach((p) => {
            assert(typeof p.x == "number" && typeof p.y == "number");
        });
        this._polygon = points;
        this._boundingBox = {
            left: Number.MAX_VALUE,
            top: Number.MAX_VALUE,
            right: Number.MIN_VALUE,
            bottom: Number.MIN_VALUE,
        };
        for (const point of points) {
            this._boundingBox.left = Math.min(point.x, this._boundingBox.left);
            this._boundingBox.top = Math.min(point.y, this._boundingBox.top);
            this._boundingBox.right = Math.max(
                point.x,
                this._boundingBox.right
            );
            this._boundingBox.bottom = Math.max(
                point.y,
                this._boundingBox.bottom
            );
        }
    }

    /**
     * Briefly draw the polygon assuming world space coordinates.
     */
    drawDebug() {
        const p = this._polygon;
        const color = new Color(1, 0, 0);
        const duration = 10;
        const thickness = 0.1;
        for (let i = 0; i < this._polygon.length; i++) {
            world.drawDebugLine(
                p[i],
                p[(i + 1) % p.length],
                color,
                duration,
                thickness
            );
        }
    }

    /**
     * Get polygon vertices.
     *
     * @returns {Array.<Vector>} List of vertices.
     */
    getPoints() {
        return this._polygon;
    }

    /**
     * Get polygon bounding box.
     *
     * @returns {Object} Dictionary from { left, top, right, bottom } to numbers.
     */
    getBoundingBox() {
        return this._boundingBox;
    }

    /**
     * Is the point within the polygon's XY frame?
     *
     * @param {Vector} point
     * @param {number} pos.x
     * @param {number} pos.y
     * @param {number} pos.z
     * @returns {boolean} True if point inside polygon
     */
    contains(point) {
        assert(typeof point == "object");
        assert(typeof point.x == "number" && typeof point.y == "number");

        // Fast-reject based on bounding box.
        if (
            point.x < this._boundingBox.left ||
            point.y < this._boundingBox.top ||
            point.x > this._boundingBox.right ||
            point.y > this._boundingBox.bottom
        ) {
            return false;
        }

        // Ray-casting method.  A point is in a polygon if a line from the
        // point to infinity crosses the polygon an odd number of times.
        // @see https://www.algorithms-and-technologies.com/point_in_polygon/javascript
        let odd = false;

        // For each edge (In this case for each point of the polygon and the previous one)
        for (
            let i = 0, j = this._polygon.length - 1;
            i < this._polygon.length;
            i++
        ) {
            // If a line from the point into infinity crosses this edge (one point above, one below)
            if (
                this._polygon[i].y > point.y !== this._polygon[j].y > point.y &&
                // ...and the edge does not cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
                point.x <
                    ((this._polygon[j].x - this._polygon[i].x) *
                        (point.y - this._polygon[i].y)) /
                        (this._polygon[j].y - this._polygon[i].y) +
                        this._polygon[i].x
            ) {
                // Invert odd
                odd = !odd;
            }
            j = i;
        }
        // If the number of crossings was odd, the point is in the polygon
        return odd;
    }

    /**
     * Create a new polygon with an inset version of this one.
     *
     * @param {number} amount
     * @returns {Polygon} Inset polygon
     */
    inset(amount) {
        assert(typeof amount === "number");

        let lineIntersection = function (a, b, c, d) {
            assert(a.x != b.x || a.y != b.y);
            assert(c.x != d.x || c.y != d.y);

            // Translate so A is at the origin.
            //A = { x : 0, y : 0 }
            let B = { x: b.x - a.x, y: b.y - a.y };
            let C = { x: c.x - a.x, y: c.y - a.y };
            let D = { x: d.x - a.x, y: d.y - a.y };

            let distAB = Math.hypot(B.x, B.y);
            assert(distAB > 0);

            // Rotate so B is on the positive X axis.
            let cos = B.x / distAB;
            let sin = B.y / distAB;
            //B = { x : distAB, y : 0 }
            C = { x: C.x * cos + C.y * sin, y: C.y * cos - C.x * sin };
            D = { x: D.x * cos + D.y * sin, y: D.y * cos - D.x * sin };
            assert(C.y != D.y); // parallel lines

            // Get intersection on the AB x axis line.
            let ABx = D.x + ((C.x - D.x) * D.y) / (D.y - C.y);

            // Reverse rotation, translation.
            return { x: a.x + ABx * cos, y: a.y + ABx * sin };
        };

        let insetCorner = function (prev, cur, next) {
            // Get line segments (preserve winding direction) and distances.
            let d1 = { x: cur.x - prev.x, y: cur.y - prev.y };
            let dist1 = Math.hypot(d1.x, d1.y);
            let d2 = { x: next.x - cur.x, y: next.y - cur.y };
            let dist2 = Math.hypot(d2.x, d2.y);
            assert(dist1 > 0 && dist2 > 0);

            // Inset line segments prev->cur and cur->next.
            let inset1 = {
                x: (d1.y * amount) / dist1,
                y: (-d1.x * amount) / dist1,
            };
            let prev1 = { x: prev.x + inset1.x, y: prev.y + inset1.y };
            let prev2 = { x: cur.x + inset1.x, y: cur.y + inset1.y };
            let inset2 = {
                x: (d2.y * amount) / dist2,
                y: (-d2.x * amount) / dist2,
            };
            let next1 = { x: cur.x + inset2.x, y: cur.y + inset2.y };
            let next2 = { x: next.x + inset2.x, y: next.y + inset2.y };

            // If both inset line segments share an endpoint, lines are colinear.
            if (prev2.x == next1.x && prev2.y == next1.y) {
                return next1;
            }

            // Otherwise get intersection point.
            return lineIntersection(prev1, prev2, next1, next2);
        };

        // Copy the first Z everywhere.
        let z = this._polygon.length > 0 ? this._polygon[0].z : 0;
        let insetPoints = [];
        let numVertices = this._polygon.length;
        for (let i = 0; i < numVertices; i++) {
            let prevPt = this._polygon[(i + numVertices - 1) % numVertices];
            let curPt = this._polygon[i];
            let nextPt = this._polygon[(i + 1) % numVertices];
            let xy = insetCorner(prevPt, curPt, nextPt);
            insetPoints.push(new Vector(xy.x, xy.y, z));
        }

        return new Polygon(insetPoints);
    }
}

module.exports = { Polygon };
