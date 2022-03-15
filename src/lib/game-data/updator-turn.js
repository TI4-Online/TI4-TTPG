const { world } = require("../../wrapper/api");

const REQUIRED_COLORS = [
    "White",
    "Blue",
    "Purple",
    "Yellow",
    "Red",
    "Green",
    "Pink",
    "Orange",
];

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (data) => {
    data.turn = "";
    const current = world.TI4.turns.getCurrentTurn();
    if (current) {
        data.turn = REQUIRED_COLORS[current.index];
        data.turnActual = capitalizeFirstLetter(current.colorName);
    }
};
