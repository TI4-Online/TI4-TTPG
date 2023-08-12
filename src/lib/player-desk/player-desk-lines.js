const assert = require("../../wrapper/assert-wrapper");
const { DrawingLine, Vector, world } = require("../../wrapper/api");

const PLAYER_DESK_BORDER = [
    new Vector(-27.9, -54.22, 0),
    new Vector(38.05, -32.9, 0),
    new Vector(38.05, 32.9, 0),
    new Vector(-27.9, 54.22, 0),
];
const THICKNESS = 1;

const LINE_TAG = "__player_desk_border__";

class PlayerDeskLines {
    static getWorldSpaceDrawingLine(playerDesk) {
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const line = new DrawingLine();
        line.color = playerDesk.widgetColor;
        line.normals = [new Vector(0, 0, 1)];
        line.points = PLAYER_DESK_BORDER.map((p) =>
            playerDesk.localPositionToWorld(p)
        );
        line.rounded = false;
        line.tag = LINE_TAG;
        line.thickness = THICKNESS;

        return line;
    }

    static addPlayerDeskLine(playerDesk) {
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const obj = playerDesk.getFrozenDummyObject();
        const line = PlayerDeskLines.getWorldSpaceDrawingLine(playerDesk);
        line.points = line.points.map((p) => obj.worldPositionToLocal(p));
        obj.addDrawingLine(line);
    }

    static clearPlayerDeskLine(playerDesk) {
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const obj = playerDesk.getFrozenDummyObject();
        for (const line of obj.getDrawingLines()) {
            if (line.tag === LINE_TAG) {
                obj.removeDrawingLineObject(line);
            }
        }
    }

    static addAllPlayerDeskLines() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            PlayerDeskLines.addPlayerDeskLine(playerDesk);
        }
    }

    static clearAllPlayerDeskLines() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            PlayerDeskLines.clearPlayerDeskLine(playerDesk);
        }
    }
}

module.exports = { PlayerDeskLines };
