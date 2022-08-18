const {
    Border,
    Button,
    HorizontalBox,
    VerticalAlignment,
    VerticalBox,
    world,
} = require("../../wrapper/api");

class ChooseFactionUi extends Border {
    /**
     * Get all available factions, in name order.
     *
     * @returns {Array.{Faction}}
     */
    static getOrderedFactions() {
        // getAllFactions accounts for using PoK, etc.
        const factions = world.TI4.getAllFactions();
        factions.sort((a, b) => {
            a = a.nameAbbr();
            b = b.nameAbbr();
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
        return factions;
    }

    constructor() {
        super();
    }
}

module.exports = { ChooseFactionUi };
