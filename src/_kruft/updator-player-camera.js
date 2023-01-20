const assert = require("../wrapper/assert-wrapper");
const { Vector, world } = require("../wrapper/api");
const { Hex } = require("../lib/hex");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.camera = {};
    });

    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const playerSlot = playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        if (!player) {
            continue;
        }
        const index = playerDesk.index;
        const playerData = data.players[index];

        const cameraPos = player.getPosition();
        const cameraDir = player.getRotation();
        const cameraForward = cameraDir.getForwardVector();

        const cameraUp = cameraDir.getUpVector();
        const fovLeft = cameraForward.rotateAngleAxis(-30, cameraUp);

        const cameraRight = cameraDir.getRightVector();
        const fovDown = cameraForward.rotateAngleAxis(20, cameraRight);

        // Line-plane intersection.
        const planeNormal = new Vector(0, 0, 1);
        const planePos = new Vector(0, 0, world.getTableHeight());
        const diff = cameraPos.subtract(planePos);
        const prod1 = diff.dot(planeNormal);
        const intersect = (dir) => {
            const prod2 = dir.dot(planeNormal);
            const prod3 = prod2 !== 0 ? prod1 / prod2 : 0;
            const pos = cameraPos.subtract(dir.multiply(prod3));
            //world.showPing(pos, [1, 0, 0, 1]);
            return pos;
        };

        const forwardPos = intersect(cameraForward);
        const fovLeftPos = intersect(fovLeft);
        const fovDownPos = intersect(fovDown);

        const scaleW = (Hex.HALF_SIZE * Math.sqrt(3)) / 2;
        const scaleH = Hex.HALF_SIZE * Math.sqrt(3);
        const scaleAvg = (scaleW + scaleH) / 2;

        // TTPG flips X/Y from expected, correct before sending.
        playerData.camera = {
            yaw: cameraDir.yaw,
            x: forwardPos.y / scaleH,
            y: forwardPos.x / scaleW,
            rX: fovDownPos.subtract(forwardPos).magnitude() / scaleAvg,
            rY: fovLeftPos.subtract(forwardPos).magnitude() / scaleAvg,
        };
    }
};
