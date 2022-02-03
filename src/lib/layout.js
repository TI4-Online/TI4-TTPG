const assert = require("../wrapper/assert");
const { Color, Rotator, Vector, world } = require("../wrapper/api");

/**
 * Find positions and rotations to place items along a path.
 * Lays out units with respect to a center position on the layout path.
 */
class Layout {
    constructor() {
        this._distanceBetween = 0;
        this._center = new Vector(0, 0, world.getTableHeight());
        this._count = 0;
        this._layoutPosRot = [];
    }

    /**
     * Set distance between units.
     *
     * @param {number} value
     * @returns {Layout} for chaining
     */
    setDistanceBetween(value) {
        assert(typeof value === "number");
        this._distanceBetween = value;
        return this;
    }

    /**
     * Set a position on the layout path at the center.
     *
     * @param {Vector} center
     * @returns {Layout} for chaining
     */
    setCenter(center) {
        //assert(center instanceof Vector);
        this._center = center;
        return this;
    }

    /**
     * Set how many points to lay out.
     *
     * @param {number} count
     * @returns {Layout} for chaining
     */
    setCount(count) {
        assert(typeof count === "number");
        this._count = count;
        return this;
    }

    /**
     * Get points after calling a layout method.
     *
     * @returns {Array.{Object.{pos:Vector, rot:Rotation}}} for chaining
     */
    getPoints() {
        return this._layoutPosRot;
    }

    /**
     * Layout in a line.
     *
     * @param {number} forwardYaw - layout left to right based on yaw pointing forward
     * @returns {Layout} for chaining
     */
    layoutLinear(forwardYaw) {
        assert(typeof forwardYaw === "number");
        assert(this._count > 0);
        assert(this._distanceBetween > 0);

        const forwardRotation = new Rotator(0, forwardYaw, 0);
        const right = forwardRotation.getRightVector().unit();
        const left = right.negate();

        const dLeft = ((this._count - 1) / 2) * this._distanceBetween;
        const d = right.multiply(this._distanceBetween);
        const p0 = this._center.add(left.multiply(dLeft));

        this._layoutPosRot = [];
        for (let i = 0; i < this._count; i++) {
            this._layoutPosRot.push({
                pos: p0.add(d.multiply(i)),
                rot: forwardRotation,
            });
        }
        return this;
    }

    /**
     * Layout in an arc.  The `setCenter` position is on the arc, using
     * the `arcOrigin` parameter to control the curve.
     *
     * @param {Vector} arcOrigin - arc is on a circle with this origin
     */
    layoutArc(arcOrigin) {
        assert(typeof arcOrigin.x === "number"); // "instanceof Vector" broken
        assert(this._count > 0);
        assert(this._distanceBetween > 0);

        // Force arg origin to be same Z plane as bag layout.
        arcOrigin = new Vector(arcOrigin.x, arcOrigin.y, this._center.z);

        // Make sure bags will fit!
        const radius = this._center.distance(arcOrigin);
        const circumference = Math.PI * 2 * radius;
        assert(circumference > this._distanceBetween * this._count);

        // Compute the angle between bags.
        const opposite = this._distanceBetween / 2; // two right triangles create distance
        const phi = Math.asin(opposite / radius);
        const dYaw = ((phi * 180) / Math.PI) * 2;
        const yaw0 = -dYaw * ((this._count - 1) / 2);

        // Get relative center for rotating about Z.
        const localCenter = this._center.subtract(arcOrigin);
        const local0 = localCenter.rotateAngleAxis(yaw0, [0, 0, 1]);

        this._layoutPosRot = [];
        for (let i = 0; i < this._count; i++) {
            const pos = local0
                .rotateAngleAxis(dYaw * i, [0, 0, 1])
                .add(arcOrigin);
            this._layoutPosRot.push({
                pos: pos,
                rot: arcOrigin.findLookAtRotation(pos),
            });
        }
        return this;
    }

    drawDebug(duration = 0) {
        const color1 = new Color(1, 0, 0, 1);
        const color2 = new Color(0, 1, 0, 1);
        const thickness1 = 0.2;
        const thickness2 = 1;
        for (let i = 0; i < this._layoutPosRot.length - 1; i++) {
            const start = this._layoutPosRot[i].pos;
            const end = this._layoutPosRot[i + 1].pos;
            world.drawDebugLine(start, end, color1, duration, thickness1);
        }
        for (let i = 0; i < this._layoutPosRot.length; i++) {
            const start = this._layoutPosRot[i].pos;
            const rot = this._layoutPosRot[i].rot;
            const end = start.add(rot.getForwardVector().multiply(4));
            world.drawDebugLine(start, end, color2, duration, thickness2);
        }

        return this;
    }
}

module.exports = { Layout };
