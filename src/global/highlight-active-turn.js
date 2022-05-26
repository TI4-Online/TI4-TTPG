const assert = require("../wrapper/assert-wrapper");
const { Borders } = require("../lib/borders/borders");
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
            world.removeLineObject(candidate);
        }
    }

    constructor(playerDesk) {
        assert(playerDesk);

        const z = world.getTableHeight() - 0.1;
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
        // TODO XXX WHEN READY
        //this._drawingLine.tag = TURN_DRAWING_LINE_TAG;
    }

    attachUI() {
        this.detachUI();
        world.addDrawingLine(this._drawingLine);
        return this;
    }

    detachUI() {
        // TODO XXX WHEN READY
        //world.removeLineObject(this._drawingLine);
        const allDrawingLines = world.getDrawingLines();
        for (let i = 0; i < allDrawingLines.length; i++) {
            const drawingLine = allDrawingLines[i];
            if (Borders.isSameDrawingLine(drawingLine, this._drawingLine)) {
                world.removeDrawingLine(i);
                break;
            }
        }
        return this;
    }
}

globalEvents.TI4.onTurnChanged.add((currentDesk, previousDesk, player) => {
    if (_turnHighlight) {
        _turnHighlight.detachUI();
    }
    _turnHighlight = new TurnHighlight(currentDesk).attachUI();
});
