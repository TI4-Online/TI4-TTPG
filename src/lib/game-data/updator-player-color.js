const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

// Overlay cannot handle custom colors.
const OVERRIDE_COLOR = ["White", "Blue", "Purple", "Yellow", "Red", "Green"];

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.color = "-";
        playerData.colorActual = "-";
    });

    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const index = playerDesk.index;
        data.players[index].color = OVERRIDE_COLOR[index] || "?";
        data.players[index].actualColor = capitalizeFirstLetter(
            playerDesk.colorName
        );
    }
};
