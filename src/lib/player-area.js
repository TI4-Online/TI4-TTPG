const assert = require("../wrapper/assert");
const { Color, Rotator, Vector, world } = require("../wrapper/api");

// TRH says units in CM, rot in degrees.
// x, y, z, rotation
// First is "right", the counterclockwise about the table.
const PLAYER_DESKS = [
    { x: 6.0544, y: 149.218, z: 3, yaw: 180.0, playerSlot: 5 }, // pink
    { x: 96.9075, y: 99.7789, z: 3, yaw: 117.5, playerSlot: 1 }, // green
    { x: 119.842, y: -6.0544, z: 3, yaw: 90.0, playerSlot: 16 }, // red
    { x: 91.3162, y: -110.52, z: 3, yaw: 62.5, playerSlot: 9 }, // yellow
    { x: -6.05441, y: -150.691, z: 3, yaw: 0, playerSlot: 6 }, // orange
    { x: -96.29, y: -99.7789, z: 3, yaw: -62.5, playerSlot: 4 }, // purple
    { x: -119.224, y: 6.05442, z: 3, yaw: -90.0, playerSlot: 15 }, // blue
    { x: -90.6987, y: 110.52, z: 3, yaw: -117.5, playerSlot: 18 }, // white
];

const SLOT_COLORS = [
    { r: 0, g: 0.427, b: 0.858, a: 1 },
    { r: 0.141, g: 1, b: 0.141, a: 1 },
    { r: 0.572, g: 0, b: 0, a: 1 },
    { r: 0, g: 0.286, b: 0.286, a: 1 },
    { r: 0.286, g: 0, b: 0.572, a: 1 },
    { r: 1, g: 0.427, b: 0.713, a: 1 },
    { r: 0.858, g: 0.427, b: 0, a: 1 },
    { r: 0.572, g: 0.286, b: 0, a: 1 },
    { r: 0.713, g: 0.858, b: 1, a: 1 },
    { r: 1, g: 1, b: 0.427, a: 1 },
    { r: 0, g: 0.572, b: 0.572, a: 1 },
    { r: 1, g: 0.713, b: 0.466, a: 1 },
    { r: 0.713, g: 0.427, b: 1, a: 1 },
    { r: 0.427, g: 0.713, b: 1, a: 1 },
    { r: 0, g: 1, b: 1, a: 1 },
    { r: 0, g: 0, b: 1, a: 1 },
    { r: 1, g: 0, b: 0, a: 1 },
    { r: 0.215, g: 0.215, b: 0.215, a: 1 },
    { r: 1, g: 1, b: 1, a: 1 },
    { r: 0, g: 0, b: 0, a: 1 },
];

class PlayerArea {
    static getPlayerDeskPosRots() {
        return PLAYER_DESKS.map((playerDesk) => {
            return {
                pos: new Vector(
                    playerDesk.x,
                    playerDesk.y,
                    world.getTableHeight() - 5
                ),
                rot: new Rotator(0, (playerDesk.yaw + 360 + 90) % 360, 0),
                playerSlot: playerDesk.playerSlot,
            };
        });
    }

    static getPlayerSlotColor(slot) {
        assert(typeof slot === "number");
        const tbl = SLOT_COLORS[slot];
        if (tbl) {
            return new Color(tbl.r, tbl.g, tbl.b, tbl.a);
        }
    }

    static drawDebug() {
        const colorLine = new Color(0, 1, 0);
        const colorPoint = new Color(1, 0, 0);
        const duration = 10;
        const thicknessLine = 1;
        const sizePoint = thicknessLine * 3;

        let i = 0;
        for (const { pos, rot } of PlayerArea.getPlayerDeskPosRots()) {
            const dir = pos.add(
                rot.getForwardVector().multiply(sizePoint * 5 + i * 3)
            );
            i++;

            world.drawDebugPoint(pos, sizePoint, colorPoint, duration);
            world.drawDebugLine(pos, dir, colorLine, duration, thicknessLine);
        }
    }
}

module.exports = { PlayerArea };
