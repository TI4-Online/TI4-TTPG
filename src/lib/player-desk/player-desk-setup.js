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
const { SetupStatusPads } = require("../../setup/setup-status-pads");
const {
    SetupSupplyBoxesDesks,
} = require("../../setup/setup-supply-boxes-desks");
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
const { AsyncTaskQueue } = require("../async-task-queue/async-task-queue");

const DISCARD_FACTION_TOKENS = true;
const ASYNC_DELAY_MSECS = 30;
const _sharedAsyncTaskQueue = new AsyncTaskQueue(ASYNC_DELAY_MSECS);

class PlayerDeskSetup {
    static getSharedAsyncTaskQueue() {
        return _sharedAsyncTaskQueue;
    }

    constructor(playerDesk) {
        assert(playerDesk);
        this._playerDesk = playerDesk;
    }

    resetAsync() {
        _sharedAsyncTaskQueue.cancel();
    }

    setupGeneric() {
        const setups = this._getGenericSetups();
        setups.forEach((setup) => setup.setup());
    }

    setupGenericAsync(callback) {
        assert(!callback || typeof callback === "function");

        const setups = this._getGenericSetups();
        setups.forEach((setup) => {
            _sharedAsyncTaskQueue.add(() => {
                setup.setup();
            });
        });
        if (callback) {
            _sharedAsyncTaskQueue.add(callback);
        }
    }

    cleanGeneric() {
        const setups = this._getGenericSetups();
        setups.forEach((setup) => setup.clean());
    }

    cleanGenericAsync(callback) {
        assert(!callback || typeof callback === "function");

        const setups = this._getGenericSetups();
        setups.forEach((setup) => {
            _sharedAsyncTaskQueue.add(() => {
                setup.clean();
            });
        });
        if (callback) {
            _sharedAsyncTaskQueue.add(callback);
        }
    }

    setupFaction(factionNsidName) {
        assert(!factionNsidName || typeof factionNsidName === "string");

        const faction = this._getFactionToUnpack(factionNsidName);
        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => setup.setup());

        const playerSlot = this._playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
    }

    setupFactionAsync(factionNsidName, callback) {
        assert(!factionNsidName || typeof factionNsidName === "string");
        assert(!callback || typeof callback === "function");

        const faction = this._getFactionToUnpack(factionNsidName);
        console.log(
            `setupFactionAsync: starting ${faction.nameAbbr} for ${this._playerDesk.colorName}`
        );
        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => {
            _sharedAsyncTaskQueue.add(() => {
                setup.setup();
            });
        });
        _sharedAsyncTaskQueue.add(() => {
            console.log(
                `setupFactionAsync: finished ${faction.nameAbbr} for ${this._playerDesk.colorName}`
            );
            const playerSlot = this._playerDesk.playerSlot;
            const player = world.getPlayerBySlot(playerSlot);
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
        });
        if (callback) {
            _sharedAsyncTaskQueue.add(callback);
        }
    }

    cleanFaction() {
        const playerSlot = this._playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            throw new Error(`cleanFaction: no faction for ${playerSlot}`);
        }
        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => setup.clean());

        const player = world.getPlayerBySlot(playerSlot);
        globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
    }

    cleanFactionAsync(callback) {
        assert(!callback || typeof callback === "function");

        const playerSlot = this._playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const setups = this._getFactionSetups(faction);
        setups.forEach((setup) => {
            _sharedAsyncTaskQueue.add(() => {
                setup.clean();
            });
        });
        _sharedAsyncTaskQueue.add(() => {
            const playerSlot = this._playerDesk.playerSlot;
            const player = world.getPlayerBySlot(playerSlot);
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
        });
        if (callback) {
            _sharedAsyncTaskQueue.add(callback);
        }
    }

    _getGenericSetups() {
        return [
            new SetupCardHolders(this._playerDesk),
            new SetupGenericHomeSystems(this._playerDesk),
            new SetupGenericPromissory(this._playerDesk),
            new SetupGenericTech(this._playerDesk),
            new SetupPlayerMats(this._playerDesk),
            new SetupSupplyBoxesDesks(this._playerDesk),
            new SetupSheets(this._playerDesk),
            new SetupStatusPads(this._playerDesk),
            new SetupUnits(this._playerDesk),
        ];
    }

    _getFactionSetups(faction) {
        assert(faction);
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

    _getFactionToUnpack(factionNsidName) {
        assert(!factionNsidName || typeof factionNsidName === "string");

        if (factionNsidName) {
            const faction = world.TI4.getFactionByNsidName(factionNsidName);
            assert(faction);
            return faction;
        }

        const factionToken = FactionToken.getByPlayerDesk(this._playerDesk);
        if (factionToken) {
            // Found a faction token / reference card, use that.
            const above = factionToken.getPosition().add([0, 0, 15]);
            factionToken.setPosition(above);
            const parsed = ObjectNamespace.parseGeneric(factionToken);
            const nsidName = parsed.name.split(".")[0];
            const faction = world.TI4.getFactionByNsidName(nsidName);
            assert(faction);

            if (DISCARD_FACTION_TOKENS) {
                const container = undefined;
                const rejectedObjects = [factionToken];
                const player = undefined;
                globalEvents.TI4.onContainerRejected.trigger(
                    container,
                    rejectedObjects,
                    player
                );
            }

            return faction;
        }

        // No token, pick a random available faction.
        const inUse = new Set();
        for (const otherDesk of world.TI4.getAllPlayerDesks()) {
            if (otherDesk === this._playerDesk) {
                continue;
            }
            const otherSlot = otherDesk.playerSlot;
            const otherFaction = world.TI4.getFactionByPlayerSlot(otherSlot);
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
        if (available.length === 0) {
            throw new Error("no factions?");
        }
        const index = Math.floor(Math.random() * available.length);
        const faction = available[index];
        assert(faction);
        return faction;
    }
}

module.exports = { PlayerDeskSetup };
