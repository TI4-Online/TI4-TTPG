const { Color, Rotator, Vector, world } = require("../wrapper/api");

// TRH says units in CM, rot in degrees.
// x, y, z, rotation
// First is "right", the counterclockwise about the table.
const PLAYER_DESKS = [
    //{ x: 6.0544, y: 149.218, z: 3, yaw: 180.0, playerSlot: 5 }, // pink
    { x: 96.9075, y: 99.7789, z: 3, yaw: 117.5, playerSlot: 1 }, // green
    { x: 119.842, y: -6.0544, z: 3, yaw: 90.0, playerSlot: 16 }, // red
    { x: 91.3162, y: -110.52, z: 3, yaw: 62.5, playerSlot: 9 }, // yellow
    //{ x: -6.05441, y: -150.691, z: 3, yaw: 0, playerSlot: 6 }, // orange
    { x: -96.29, y: -99.7789, z: 3, yaw: -62.5, playerSlot: 4 }, // purple
    { x: -119.224, y: 6.05442, z: 3, yaw: -90.0, playerSlot: 15 }, // blue
    { x: -90.6987, y: 110.52, z: 3, yaw: -117.5, playerSlot: 18 }, // white
];
class Setup {
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

    static drawDebug() {
        const colorLine = new Color(0, 1, 0);
        const colorPoint = new Color(1, 0, 0);
        const duration = 10;
        const thicknessLine = 1;
        const sizePoint = thicknessLine * 3;

        let i = 0;
        for (const { pos, rot } of Setup.getPlayerDeskPosRots()) {
            const dir = pos.add(
                rot.getForwardVector().multiply(sizePoint * 5 + i * 3)
            );
            i++;

            world.drawDebugPoint(pos, sizePoint, colorPoint, duration);
            world.drawDebugLine(pos, dir, colorLine, duration, thicknessLine);
        }
    }
}

module.exports = { Setup };
