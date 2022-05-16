const { world } = require("../../wrapper/api");

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (data) => {
    data.turn = "";
    const current = world.TI4.turns.getCurrentTurn();
    if (current) {
        data.turn = capitalizeFirstLetter(current.colorName);
    }
};
