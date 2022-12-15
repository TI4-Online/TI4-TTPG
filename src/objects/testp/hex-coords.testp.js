// Place on a system tile to add hex coordinates to description on drop.
const { Hex } = require("../../lib/hex");
const { refObject } = require("../../wrapper/api");

refObject.onReleased.add((obj) => {
    const pos = obj.getPosition();
    const hex = Hex.fromPosition(pos);
    obj.setDescription(hex);
    console.log(`hex coords: ${hex}`);
});
