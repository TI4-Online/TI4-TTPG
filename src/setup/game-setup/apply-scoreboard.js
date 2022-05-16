const assert = require("../../wrapper/assert-wrapper");
const { Scoreboard } = require("../../lib/scoreboard/scoreboard");
const { TableLayout } = require("../../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../../wrapper/api");

class ApplyScoreboard {
    constructor() {}

    apply(gamePoints) {
        assert(typeof gamePoints === "number");

        const scoreboard = Scoreboard.getScoreboard();
        if (!scoreboard) {
            return false;
        }

        // Scoreboard object is anchored at bottom, not center.  Move it up as
        // well as flipping it to prevent it from sinking into table.
        const pos = new Vector(
            TableLayout.anchor.score.pos.x,
            TableLayout.anchor.score.pos.y,
            world.getTableHeight() + 5
        );
        let rot;
        if (gamePoints <= 10) {
            rot = new Rotator(0, -90, 0);
        } else {
            rot = new Rotator(0, 90, 180);
        }
        rot = rot.compose(new Rotator(0, TableLayout.anchor.score.yaw, 0));

        scoreboard.setObjectType(ObjectType.Regular);
        scoreboard.setPosition(pos, 0);
        scoreboard.setRotation(rot, 0); // careful if animating this, saw a collision (??)
        scoreboard.setObjectType(ObjectType.Ground);

        return true;
    }
}

module.exports = { ApplyScoreboard };
