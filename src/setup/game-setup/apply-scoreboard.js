const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { MATS } = require("../setup-table-mats");
const { ObjectType, Rotator, Vector, world } = require("../../wrapper/api");

class ApplyScoreboard {
    constructor() {}

    apply(gamePoints) {
        assert(typeof gamePoints === "number");

        const scoreboard = this._getScoreboard();
        if (!scoreboard) {
            return false;
        }

        // Scoreboard object is anchored at bottom, not center.  Move it up as
        // well as flipping it to prevent it from sinking into table.
        let matData = false;
        for (const candidate of MATS) {
            if (candidate.nsid === "token:base/scoreboard") {
                matData = candidate;
                break;
            }
        }
        assert(matData);
        const pos = new Vector(
            matData.pos.x,
            matData.pos.y,
            world.getTableHeight() + 5
        );
        let rot;
        if (gamePoints <= 10) {
            rot = new Rotator(0, 180, 0);
        } else {
            rot = new Rotator(0, 0, 180);
        }

        scoreboard.setObjectType(ObjectType.Regular);
        scoreboard.setPosition(pos, 0);
        scoreboard.setRotation(rot, 0); // careful if animating this, saw a collision (??)
        scoreboard.setObjectType(ObjectType.Ground);

        return true;
    }

    _getScoreboard() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "token:base/scoreboard") {
                return obj;
            }
        }
    }
}

module.exports = { ApplyScoreboard };
