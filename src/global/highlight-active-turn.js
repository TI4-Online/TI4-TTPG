const assert = require("../wrapper/assert-wrapper");
const { DrawingLine, Vector, globalEvents, world } = require("../wrapper/api");

const LENGTH = 40;
const THICKNESS = 1;
const TURN_DRAWING_LINE_TAG = "__turn_line__";

let _turnHighlight = undefined;

class TurnHighlight {
    static removeAllTurnHighlightLines() {
        const dele = [];
        for (const candidate of world.getDrawingLines()) {
            if (candidate.tag === TURN_DRAWING_LINE_TAG) {
                dele.push(candidate);
            }
        }
        for (const candidate of dele) {
            world.removeDrawingLineObject(candidate);
        }
    }

    constructor(playerDesk) {
        assert(playerDesk);

        const z = world.getTableHeight() + 0.1;
        const points = [
            new Vector(42, -LENGTH / 2, 0),
            new Vector(42, LENGTH / 2, 0),
        ].map((point) => {
            point = playerDesk.localPositionToWorld(point);
            point.z = z;
            return point;
        });

        this._drawingLine = new DrawingLine();
        this._drawingLine.color = playerDesk.color;
        this._drawingLine.points = points;
        this._drawingLine.rounded = true;
        this._drawingLine.thickness = THICKNESS;
        this._drawingLine.tag = TURN_DRAWING_LINE_TAG;
    }

    attachUI() {
        world.addDrawingLine(this._drawingLine);
        return this;
    }

    detachUI() {
        world.removeDrawingLineObject(this._drawingLine);
        return this;
    }
}

globalEvents.TI4.onTurnChanged.add((currentDesk, previousDesk, player) => {
    if (_turnHighlight) {
        _turnHighlight.detachUI();
    } else {
        // The first time called scrub the world of these lines.
        TurnHighlight.removeAllTurnHighlightLines();
    }
    _turnHighlight = new TurnHighlight(currentDesk).attachUI();
});
