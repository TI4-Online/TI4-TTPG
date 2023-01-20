const GameDataUtil = undefined;
const gameData = undefined;
const canvasWidth = undefined;
const canvasHeight = undefined;
const scaleX = undefined;
const scaleY = undefined;

// Overlay code.
const playerDataArray = GameDataUtil.parsePlayerDataArray(gameData);
for (const playerData of playerDataArray) {
    const camera = playerData.camera;
    if (camera?.x === undefined) {
        continue;
    }

    const yaw = (camera.yaw * Math.PI) / 180 + Math.PI / 2;
    const x = canvasWidth / 2 + camera.x * scaleX + 0.1 * scaleX;
    const y = canvasHeight / 2 - camera.y * scaleY - 0 * scaleY;
    const rX = (camera.rX * (scaleX + scaleY)) / 2;
    const rY = (camera.rY * (scaleX + scaleY)) / 2;

    const colorHex = GameDataUtil.parsePlayerColor(playerData).colorHex;

    const ctx = this._canvas.getContext("2d");
    ctx.save();

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 20;
    ctx.setLineDash([3, 10]);

    ctx.beginPath();
    ctx.ellipse(x, y, rX, rY, yaw, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}
