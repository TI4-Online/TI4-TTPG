const assert = require("../../wrapper/assert-wrapper");
const { AuxDataBuilder, AuxData } = require("./auxdata");
const { Faction } = require("../faction/faction");
const { System } = require("../system/system");

it("constructor", () => {
    const auxData = new AuxDataBuilder().build();
    assert(auxData instanceof AuxData);
});

it("rich constructor", () => {
    const playerSlot = 7;
    const faction = Faction.getByNsidName("arborec");
    const hex = "<0,0,0>";
    const activatingPlayerSlot = 8;
    const activeSystem = System.getByTileNumber(18);
    const activePlanet = activeSystem.planets[0];

    const auxData = new AuxDataBuilder()
        .setPlayerSlot(playerSlot)
        .setFaction(faction)
        .setHex(hex)
        .setActivatingPlayerSlot(activatingPlayerSlot)
        .setActiveSystem(activeSystem)
        .setActivePlanet(activePlanet)
        .build();
    assert(auxData instanceof AuxData);

    assert.equal(auxData.playerSlot, playerSlot);
    assert.equal(auxData.faction, faction);
    assert.equal(auxData.hex, hex);
    assert.equal(auxData.activatingPlayerSlot, activatingPlayerSlot);
    assert.equal(auxData.activeSystem, activeSystem);
    assert.equal(auxData.activePlanet, activePlanet);
});
