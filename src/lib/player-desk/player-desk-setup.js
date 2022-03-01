const { FactionToken } = require("../faction/faction-token");
const { ObjectNamespace } = require("../object-namespace");

const { SetupCardHolders } = require("../../setup/setup-card-holders");
const {
    SetupGenericHomeSystems,
} = require("../../setup/setup-generic-home-systems");
const {
    SetupGenericPromissory,
} = require("../../setup/setup-generic-promissory");
const { SetupGenericTech } = require("../../setup/setup-generic-tech");
const { SetupPlayerMats } = require("../../setup/setup-player-mats");
const { SetupSheets } = require("../../setup/setup-sheets");
const { SetupSupplyBoxes } = require("../../setup/setup-supply-boxes");
const { SetupUnits } = require("../../setup/setup-units");

const {
    SetupFactionAlliance,
} = require("../../setup/faction/setup-faction-alliance");
const {
    SetupFactionExtra,
} = require("../../setup/faction/setup-faction-extra");
const {
    SetupFactionLeaders,
} = require("../../setup/faction/setup-faction-leaders");
const {
    SetupFactionPromissory,
} = require("../../setup/faction/setup-faction-promissory");
const {
    SetupFactionSheet,
} = require("../../setup/faction/setup-faction-sheet");
const { SetupFactionTech } = require("../../setup/faction/setup-faction-tech");
const {
    SetupFactionTokens,
} = require("../../setup/faction/setup-faction-tokens");
const { SetupHomeSystem } = require("../../setup/faction/setup-home-system");
const {
    SetupStartingTech,
} = require("../../setup/faction/setup-starting-tech");
const {
    SetupStartingUnits,
} = require("../../setup/faction/setup-starting-units");

const { globalEvents, world } = require("../../wrapper/api");
const assert = require("../../wrapper/assert-wrapper");

class PlayerDeskSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        this._playerDesk = playerDesk;
    }

    setupGeneric() {
        const setups = this._getGenericSetups();
        setups.forEach((setup) => setup.setup());
    }

    cleanGeneric() {
        const setups = this._getGenericSetups();
        setups.forEach((setup) => setup.clean());
    }

    setupFaction() {
        let faction = false;
        const factionToken = FactionToken.getByPlayerDesk(this._playerDesk);

        if (factionToken) {
            // Found a faction token / reference card, use that.
            const above = factionToken.getPosition().add([0, 0, 15]);
            factionToken.setPosition(above);
            const parsed = ObjectNamespace.parseGeneric(factionToken);
            faction = world.TI4.getFactionByNsidName(parsed.name);
        } else {
            // No token, pick a random available faction.
            const inUse = new Set();
            for (const otherDesk of world.TI4.getAllPlayerDesks()) {
                if (otherDesk === this._playerDesk) {
                    continue;
                }
                const otherSlot = otherDesk.playerSlot;
                const otherFaction =
                    world.TI4.getFactionByPlayerSlot(otherSlot);
                if (otherFaction) {
                    inUse.add(otherFaction);
                }
            }
            const available = [];
            for (const candidate of world.TI4.getAllFactions()) {
                if (!inUse.has(candidate)) {
                    available.push(candidate);
                }
            }
            if (available.length > 0) {
                const index = Math.floor(Math.random() * available.length);
                faction = available[index];
            }
        }

        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => setup.setup());

        const playerSlot = this._playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
    }

    cleanFaction() {
        const playerSlot = this._playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => setup.clean());

        const player = world.getPlayerBySlot(playerSlot);
        globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
    }

    _getGenericSetups() {
        return [
            new SetupCardHolders(this._playerDesk),
            new SetupGenericPromissory(this._playerDesk),
            new SetupGenericTech(this._playerDesk),
            new SetupUnits(this._playerDesk),
            new SetupSupplyBoxes(this._playerDesk),
            new SetupSheets(this._playerDesk),
            new SetupGenericHomeSystems(this._playerDesk),
            new SetupPlayerMats(this._playerDesk),
        ];
    }

    _getFactionSetups(faction) {
        return [
            new SetupFactionAlliance(this._playerDesk, faction),
            new SetupFactionExtra(this._playerDesk, faction),
            new SetupFactionLeaders(this._playerDesk, faction),
            new SetupFactionPromissory(this._playerDesk, faction),
            new SetupFactionSheet(this._playerDesk, faction),
            new SetupFactionTech(this._playerDesk, faction),
            new SetupFactionTokens(this._playerDesk, faction),
            new SetupHomeSystem(this._playerDesk, faction),
            new SetupStartingTech(this._playerDesk, faction),
            new SetupStartingUnits(this._playerDesk, faction),
        ];
    }
}

module.exports = { PlayerDeskSetup };
