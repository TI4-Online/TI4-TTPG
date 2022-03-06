const { world } = require("../wrapper/api");
const {
    addDistantSunsRightClick,
} = require("../lib/faction-abilities/distant-suns");

for (const obj of world.getAllObjects()) {
    const owner = obj.getOwningPlayerSlot();
    if (!owner) {
        continue;
    }

    const faction = world.TI4.getFactionByPlayerSlot(owner);
    if (faction && faction.raw.abilities.includes("distant_suns")) {
        addDistantSunsRightClick(obj);
    }
}
