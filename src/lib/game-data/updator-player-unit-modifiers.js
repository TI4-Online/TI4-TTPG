const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");
const { UnitModifier } = require("../unit/unit-modifier");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.unitUpgrades = [];
    });

    world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);

        const playerModifers = UnitModifier.getPlayerUnitModifiers(
            playerSlot,
            "self"
        );
        const factionModifiers = faction
            ? UnitModifier.getFactionUnitModifiers(faction, "self")
            : [];

        let unitModifiers = [];
        unitModifiers.push(...playerModifers);
        unitModifiers.push(...factionModifiers);

        const seen = new Set();
        unitModifiers = unitModifiers.map((m) => {
            const parts = m.raw.localeName.split(".");
            return {
                name: m.name,
                localeName: parts[parts.length - 1],
            };
        });
        unitModifiers = unitModifiers.filter((m) => {
            if (seen.has(m.name)) {
                return false;
            }
            seen.add(m.name);
            return true;
        });

        data.players[playerDesk.index].unitModifiers = unitModifiers;
    });
};
