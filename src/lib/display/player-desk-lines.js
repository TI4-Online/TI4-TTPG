const assert = require("../../wrapper/assert-wrapper");
const { DrawingLine, Vector, world } = require("../../wrapper/api");
const { globalEvents } = require("@tabletop-playground/api");

const PLAYER_DESK_BORDER = [
    new Vector(-27.9, -54.22, 0),
    new Vector(38.05, -32.9, 0),
    new Vector(38.05, 32.9, 0),
    new Vector(-27.9, 54.22, 0),
];
const THICKNESS = 1;

const LINE_TAG = "__player_desk_line__";

class PlayerDeskLines {
    /**
     * Do any player desk lines exist?
     *
     * @returns {boolean}
     */
    static isEnabled() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const obj = playerDesk.getFrozenDummyObject();
            for (const line of obj.getDrawingLines()) {
                if (line.tag === LINE_TAG) {
                    return true;
                }
            }
        }
        return false;
    }

    static addAllPlayerDeskLines() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            PlayerDeskLines._addPlayerDeskLine(playerDesk);
        }
    }

    static clearAllPlayerDeskLines() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            PlayerDeskLines._clearPlayerDeskLine(playerDesk);
        }
    }

    static _createWorldSpaceDrawingLine(playerDesk) {
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

    static _addPlayerDeskLine(playerDesk) {
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const obj = playerDesk.getFrozenDummyObject();
        const line = PlayerDeskLines._createWorldSpaceDrawingLine(playerDesk);
        line.points = line.points.map((p) => obj.worldPositionToLocal(p));
        obj.addDrawingLine(line);
    }

    static _clearPlayerDeskLine(playerDesk) {
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const obj = playerDesk.getFrozenDummyObject();
        for (const line of obj.getDrawingLines()) {
            if (line.tag === LINE_TAG) {
                obj.removeDrawingLineObject(line);
            }
        }
    }
}

// Turn on by default.
process.nextTick(() => {
    if (world.TI4.config.timestamp <= 0 && !PlayerDeskLines.isEnabled()) {
        PlayerDeskLines.addAllPlayerDeskLines();
    }

    // Player count change happens before setup, no opportunity to disable lines yet.
    globalEvents.TI4.onPlayerCountChanged.add(() => {
        PlayerDeskLines.clearAllPlayerDeskLines();
        PlayerDeskLines.addAllPlayerDeskLines();
    });
});

module.exports = { PlayerDeskLines };
