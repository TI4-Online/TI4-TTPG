const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitAttrsSet } = require("../unit/unit-attrs-set");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.unitUpgrades = [];
    });

    world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);

        // Find unit upgrades.
        const unitAttrsSet = new UnitAttrsSet();
        const upgrades = UnitAttrs.getPlayerUnitUpgrades(playerSlot);
        if (faction) {
            const factionUpgrades = UnitAttrs.getFactionUnitUpgrades(faction);
            upgrades.push(...factionUpgrades);
        }

        // Make sure there are no duplicates (paranoia).
        upgrades.filter((value, index, self) => self.indexOf(value) === index);

        // Apply upgrades now, so unit modifiers can see upgraded units.
        UnitAttrs.sortUpgradeLevelOrder(upgrades);
        for (const upgrade of upgrades) {
            unitAttrsSet.upgrade(upgrade);
        }

        const unitUpgrades = data.players[playerDesk.index].unitUpgrades;
        for (const unitAttrs of unitAttrsSet.values()) {
            if (unitAttrs.raw.upgradeLevel > 1) {
                unitUpgrades.push(unitAttrs.unit);
            }
        }
    });
};
