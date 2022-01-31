const assert = require("../wrapper/assert");
const _ = require("../wrapper/lodash");
const locale = require("../lib/locale");
const {
    Container,
    ObjectType,
    Rotator,
    Vector,
    world,
} = require("../wrapper/api");

const UNIT_BAGS = require("./unit-bags.data");

/**
 * Setup per-player unit bags, assigning to player slot.
 * Setup can be in a line, or arc.
 */
class UnitBags {
    /**
     * Constructor.
     */
    constructor() {
        this._unitBags = _.cloneDeep(UNIT_BAGS);
    }

    /**
     * Get unit bag data (contains bag/unit GUID, bag positions).
     *
     * @returns {Array.{object}}
     */
    get unitBags() {
        return this._unitBags;
    }

    /**
     * Setup will place bags in a line.
     *
     * @param {Vector} centerPosition - unit bags center position
     * @param {Rotator} forwardRotation - [0, yaw, 0] layout left to right based on this being forward
     * @param {number} distanceBetweenBags
     */
    layoutLinear(centerPosition, forwardRotation, distanceBetweenBags) {
        assert(centerPosition instanceof Vector);
        assert(forwardRotation instanceof Rotator);
        assert(typeof distanceBetweenBags === "number");

        const right = forwardRotation.getRightVector().unit();
        const left = right.negate();

        const numBags = this._unitBags.length;
        const dLeft = ((numBags - 1) / 2) * distanceBetweenBags;
        console.log(`numBags=${numBags} dLeft=${dLeft}`);
        const p0 = centerPosition.add(left.multiply(dLeft));
        const d = right.multiply(distanceBetweenBags);

        for (let i = 0; i < numBags; i++) {
            const unitBag = this._unitBags[i];
            unitBag.pos = p0.add(d.multiply(i));
            unitBag.rot = forwardRotation;
            console.log(`i=${i} unitBag.pos=${unitBag.pos}`);
        }
    }

    /**
     * Setup will place bags in an arc.
     *
     * @param {Vector} centerPosition - unit bags center position, on arc
     * @param {Vector} arcOrigin - arc is on a circle with this origin
     * @param {number} distanceBetweenBags
     */
    layoutArc(centerPosition, arcOrigin, distanceBetweenBags) {
        assert(centerPosition instanceof Vector);
        assert(arcOrigin instanceof Vector);
        assert(typeof distanceBetweenBags === "number");

        // Force arg origin to be same Z plane as bag layout.
        arcOrigin = new Vector(arcOrigin.x, arcOrigin.y, centerPosition.z);

        // Make sure bags will fit!
        const radius = centerPosition.distance(arcOrigin);
        const circumference = Math.PI * 2 * radius;
        const numBags = this._unitBags.length;
        assert(circumference > distanceBetweenBags * numBags);

        // Compute the angle between bags.
        const opposite = distanceBetweenBags / 2; // two right triangles create distance
        const phi = Math.asin(opposite / radius);
        const dYaw = ((phi * 180) / Math.PI) * 2;
        const yaw0 = -dYaw * ((numBags - 1) / 2);

        // Get relative center for rotating about Z.
        const localCenter = centerPosition.subtract(arcOrigin);
        const local0 = localCenter.rotateAngleAxis(yaw0, [0, 0, 1]);

        for (let i = 0; i < numBags; i++) {
            const unitBag = this._unitBags[i];
            unitBag.pos = local0
                .rotateAngleAxis(dYaw * i, [0, 0, 1])
                .add(arcOrigin);
            unitBag.rot = unitBag.pos.findLookAtRotation(arcOrigin);
        }
    }

    /**
     * Create unit bags (and units) for the player.
     * Must have called a layout method first.
     *
     * @param {number} playerSlot
     */
    setup(playerSlot) {
        assert(typeof playerSlot === "number");

        for (const unitBag of this._unitBags) {
            assert(unitBag.pos && unitBag.rot); // verify layout done

            const unitName = locale(unitBag.localeName);

            unitBag.obj = world.createObjectFromTemplate(
                unitBag.bagTemplateId,
                unitBag.pos
            );
            assert(unitBag.obj instanceof Container);
            unitBag.obj.setRotation(unitBag.rot, -1);
            unitBag.obj.setOwningPlayerSlot(playerSlot);
            unitBag.obj.setName(unitName);
            unitBag.obj.setObjectType(ObjectType.Ground);

            // Setting bag owning player slot changes primary color.
            // Setting unit owning player slot changes only slot, not color.
            const tintColor = unitBag.obj.getPrimaryColor();

            const unitObjs = [];
            for (let i = 0; i < unitBag.unitCount; i++) {
                const pos = unitBag.pos.add([0, 0, 10 * (i + 1)]);
                const unitObj = world.createObjectFromTemplate(
                    unitBag.unitTemplateId,
                    pos
                );
                unitObj.setOwningPlayerSlot(playerSlot);
                unitObj.setPrimaryColor(tintColor);
                unitObj.setName(unitName);
                unitObjs.push(unitObj);
            }

            unitBag.obj.addObjects(unitObjs, 0, false);
        }
    }
}

module.exports = {
    UnitBags,
};
