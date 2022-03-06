const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { world } = require("../../wrapper/api");
const {
    addDistantSunsRightClick,
    removeDistantSunsRightClick,
} = require("../../lib/faction-abilities/distant-suns");
const locale = require("../../lib/locale");

class SetupFactionAbilities extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const slot = this.playerDesk.playerSlot;
        if (this.faction.raw.abilities.includes("distant_suns")) {
            const player = world.getPlayerBySlot(slot);
            if (player) {
                player.showMessage(locale("ui.message.distant_suns_helper"));
                player.sendChatMessage(
                    locale("ui.message.distant_suns_helper")
                );
            }
            for (const obj of world.getAllObjects()) {
                if (obj.getOwningPlayerSlot() !== slot) {
                    continue;
                }
                addDistantSunsRightClick(obj);
            }
        }
    }

    clean() {
        if (this.faction.raw.abilities.includes("distant_suns")) {
            for (const obj of world.getAllObjects()) {
                if (obj.getOwningPlayerSlot() !== this.playerDesk.playerSlot) {
                    continue;
                }
                removeDistantSunsRightClick(obj);
            }
        }
    }
}

module.exports = { SetupFactionAbilities };
