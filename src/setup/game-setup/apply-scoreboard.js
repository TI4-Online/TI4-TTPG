const assert = require("../../wrapper/assert-wrapper");
const { Scoreboard } = require("../../lib/scoreboard/scoreboard");
const { TableLayout } = require("../../table/table-layout");
const {
    DrawingLine,
    ObjectType,
    Rotator,
    Vector,
    world,
} = require("../../wrapper/api");

class ApplyScoreboard {
    constructor() {
        throw new Error("static only");
    }

    static resetPositionAndOrientation(gamePoints) {
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
        scoreboard.snapToGround();
        scoreboard.setObjectType(ObjectType.Ground);

        return true;
    }

    static resetScorableUI(gamePoints) {
        assert(typeof gamePoints === "number");

        const scoreboard = Scoreboard.getScoreboard();
        if (!scoreboard) {
            return false;
        }

        for (const drawingLine of scoreboard.getDrawingLines()) {
            scoreboard.removeDrawingLineObject(drawingLine);
        }
        const startIndex = gamePoints + 1;
        const endIndex = gamePoints <= 10 ? 10 : 14;

        if (startIndex > endIndex) {
            return false;
        }

        const p0 = Scoreboard.getScoreLocalPos(scoreboard, startIndex);
        const p1 = Scoreboard.getScoreLocalPos(scoreboard, endIndex);
        const normal = new Vector(0, 0, 1);

        if (gamePoints < 10) {
            p0.z = scoreboard.getSize().z + 0.01;
            p1.z = p0.z;
        } else {
            p0.z = -0.01;
            p1.z = p0.z;
            normal.z = -1;
        }

        const c = 0.02;
        const drawingLine = new DrawingLine();
        drawingLine.color = [c, c, c, 1];
        drawingLine.normals = [normal];
        drawingLine.points = [p0, p1];
        drawingLine.thickness = 3;
        scoreboard.addDrawingLine(drawingLine);

        return true;
    }
}

module.exports = { ApplyScoreboard };
