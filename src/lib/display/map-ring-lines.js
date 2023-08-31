const { ColorUtil } = require("../color/color-util");
const { Hex } = require("../../lib/hex");
const { DrawingLine, Vector, world } = require("../../wrapper/api");

const HEX_CORNERS = [
    { q: 1, r: 0, s: -1 },
    { q: 0, r: 1, s: -1 },
    { q: -1, r: 1, s: 0 },
    { q: -1, r: 0, s: 1 },
    { q: 0, r: -1, s: 1 },
    { q: 1, r: -1, s: 0 },
];
const THICKNESS = 0.25;
const COLORS = [
    "#008080", // teal
    "#FC6A03", // orange
    "#F46FCD", // pink
    "#00CFFF", // blue
    "#F0F0F0", // white
];

const LINE_TAG = "__map_ring_line__";

class MapRingLines {
    static isEnabled() {
        for (const line of world.getDrawingLines()) {
            if (line.tag === LINE_TAG) {
                return true;
            }
        }
        return false;
    }

    static addMapRingLines() {
        const z = world.getTableHeight(); // no need to go "above", the table model is slightly recessed into its collider

        const numRings = world.TI4.config.playerCount <= 6 ? 3 : 4;

        for (let i = 0; i < numRings; i++) {
            const colorHex = COLORS[i % COLORS.length];

            const points = HEX_CORNERS.map((hex) => {
                const ring = i + 1;
                hex = `<${hex.q * ring},${hex.r * ring},${hex.s * ring}>`;
                const pos = Hex.toPosition(hex);
                pos.z = z;
                return pos;
            });
            // wrap to avoid "pacman" line joint
            points.push(points[0]);
            points.push(points[1]);

            const line = new DrawingLine();
            line.color = ColorUtil.colorFromHex(colorHex);
            line.normals = [new Vector(0, 0, 1)];
            line.points = points;
            line.rounded = false;
            line.tag = LINE_TAG;
            line.thickness = THICKNESS;
            world.addDrawingLine(line);
        }
    }

    static clearMapRingLines() {
        for (const line of world.getDrawingLines()) {
            if (line.tag === LINE_TAG) {
                world.removeDrawingLineObject(line);
            }
        }
    }
}

// Turn on by default.
process.nextTick(() => {
    if (world.TI4.config.timestamp <= 0 && !MapRingLines.isEnabled()) {
        MapRingLines.addMapRingLines();
    }
});

module.exports = { MapRingLines };
