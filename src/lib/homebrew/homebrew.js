const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Adjacency } = require("../system/adjacency");
const { AdjacencyWormhole } = require("../system/adjacency-wormhole");
const { Agenda } = require("../agenda/agenda");
const { Attachment } = require("../../objects/attachments/attachment");
const { Broadcast } = require("../broadcast");
const { DealActionCards, EndStatusPhase } = require("../phase/end-of-round");
const { Faction } = require("../faction/faction");
const { Franken } = require("../draft/franken/franken");
const { HomebrewLoader } = require("./homebrew-loader");
const { ReplaceObjects } = require("../../setup/spawn/replace-objects");
const { RestrictObjects } = require("../../setup/spawn/restrict-objects");
const {
    RightClickScore,
} = require("../../global/right-click/right-click-score");
const { SetupGenericTech } = require("../../setup/setup-generic-tech");
const { SetupStrategyCards } = require("../../setup/setup-strategy-cards");
const { SetupSystemTiles } = require("../../setup/setup-system-tiles");
const { SetupTableDecks } = require("../../setup/setup-table-decks");
const {
    SetupGenericPromissory,
} = require("../../setup/setup-generic-promissory");
const { Spawn } = require("../../setup/spawn/spawn");
const { System } = require("../system/system");
const { Technology } = require("../technology/technology");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitModifier } = require("../unit/unit-modifier");
const { shuffleAllDecks } = require("../../global/shuffle-decks-on-load");
const {
    injectRightClickSystemAction,
} = require("../../global/right-click/right-click-system");
const { Rotator, Vector, world } = require("../../wrapper/api");
const { TableLayout } = require("../../table/table-layout");

class Homebrew {
    constructor() {
        this._pending = new Set();
    }

    register(entry) {
        HomebrewLoader.getInstance().register(entry);
    }

    inject(table) {
        if (table.adjacencyModifiers) {
            for (const adjacencyModifier of table.adjacencyModifiers) {
                Adjacency.injectAdjacencyModifier(adjacencyModifier);
            }
        }
        if (table.attachments) {
            for (const attachment of table.attachments) {
                Attachment.injectAttachment(attachment);
            }
        }
        if (table.extraBoxes) {
            this._delayedSpawnExtraBoxes(table.extraBoxes);
        }
        if (table.factionAbilities) {
            for (const ability of table.factionAbilities) {
                Franken.injectFactionAbility(ability);
            }
        }
        if (table.factionUndraftable) {
            for (const undraftable of table.factionUndraftable) {
                Franken.injectUndraftable(undraftable);
            }
        }
        if (table.factions) {
            for (const faction of table.factions) {
                Faction.injectFaction(faction);
            }
        }
        if (table.localeStrings) {
            // "faction.abbr.<x>", "faction.full.<x>"
            for (const [key, value] of Object.entries(table.localeStrings)) {
                assert(typeof key === "string");
                assert(typeof value === "string");
                locale.inject(key, value);
            }
        }
        if (table.nsidToTemplateId) {
            // Faction sheet, token template, promissory, leader cards, etc.
            for (const [nsid, tempateId] of Object.entries(
                table.nsidToTemplateId
            )) {
                Spawn.injectNsidToTemplate(nsid, tempateId);
            }
        }
        if (table.otherScorable) {
            for (const nsid of table.otherScorable) {
                RightClickScore.injectOtherScorableNSID(nsid);
            }
        }
        if (table.remove) {
            for (const nsid of table.remove) {
                RestrictObjects.injectRestrictNsid(nsid);
            }
        }
        if (table.replace) {
            for (const [removeNSID, useNSID] of Object.entries(table.replace)) {
                ReplaceObjects.injectReplace(removeNSID, useNSID);
            }
        }
        if (table.rightClickSystem) {
            for (const generator of table.rightClickSystem) {
                injectRightClickSystemAction(generator);
            }
        }
        if (table.statusPhaseActionDealModifiers) {
            for (const generator of table.statusPhaseActionDealModifiers) {
                DealActionCards.injectStatusPhaseActionDealModifier(generator);
            }
        }
        if (table.statusPhaseTokenDealModifiers) {
            for (const generator of table.statusPhaseTokenDealModifiers) {
                EndStatusPhase.injectStatusPhaseTokenDealModifier(generator);
            }
        }
        if (table.systems) {
            for (const system of table.systems) {
                System.injectSystem(system);
            }
        }
        if (table.technologies) {
            for (const technology of table.technologies) {
                Technology.injectTechnology(technology);
            }
        }
        if (table.unitAttrs) {
            for (const unitAttrs of table.unitAttrs) {
                UnitAttrs.injectUnitAttrs(unitAttrs);
            }
        }
        if (table.unitModifiers) {
            for (const unitModifier of table.unitModifiers) {
                UnitModifier.injectUnitModifier(unitModifier);
            }
        }
        if (table.voteCountModifiers) {
            for (const voteCountModifier of table.voteCountModifiers) {
                Agenda.injectVoteCountModifier(voteCountModifier);
            }
        }
        if (table.wormholeAdjacencyModifiers) {
            for (const wormholeAdjacencyModifier of table.wormholeAdjacencyModifiers) {
                AdjacencyWormhole.injectWormholeAdjacencyModifier(
                    wormholeAdjacencyModifier
                );
            }
        }
        return this;
    }

    /**
     * Delete and respawn decks.
     *
     * If homebrew messes with the generic tech, agenda, action, etc decks the
     * ones on the table need to be recreated.
     */
    resetOnTableDecks() {
        console.log("Homebrew.resetOnTableDecks");

        if (world.TI4.config.timestamp > 0) {
            Broadcast.chatAll(
                locale("ui.error.homebrew.resetAfterLoaded"),
                Broadcast.ERROR
            );
            return;
        }

        const key = "resetOnTableDecks";
        const delayed = () => {
            this._pending.delete(key);

            const setupTableDecks = new SetupTableDecks();
            setupTableDecks.clean();
            setupTableDecks.setup();
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const setupGenericTech = new SetupGenericTech(playerDesk);
                setupGenericTech.clean();
                setupGenericTech.setup();
            }

            // Shuffle appropriate decks.
            process.nextTick(shuffleAllDecks);
        };

        if (!this._pending.has(key)) {
            this._pending.add(key);
            process.nextTick(delayed);
        }

        return this;
    }

    resetStrategyCards() {
        console.log("Homebrew.resetStrategyCards");

        if (world.TI4.config.timestamp > 0) {
            Broadcast.chatAll(
                locale("ui.error.homebrew.resetAfterLoaded"),
                Broadcast.ERROR
            );
            return;
        }

        const key = "resetStrategyCards";
        const delayed = () => {
            this._pending.delete(key);

            const setupStrategyCards = new SetupStrategyCards();
            setupStrategyCards.clean();
            setupStrategyCards.setup();
        };

        if (!this._pending.has(key)) {
            this._pending.add(key);
            process.nextTick(delayed);
        }

        return this;
    }

    resetSystemTilesBox() {
        console.log("Homebrew.resetSystemTilesBox");

        if (world.TI4.config.timestamp > 0) {
            Broadcast.chatAll(
                locale("ui.error.homebrew.resetAfterLoaded"),
                Broadcast.ERROR
            );
            return;
        }

        const key = "resetSystemTilesBox";
        const delayed = () => {
            this._pending.delete(key);

            const setupSystemTiles = new SetupSystemTiles();
            setupSystemTiles.clean();
            setupSystemTiles.setup();
        };

        if (!this._pending.has(key)) {
            this._pending.add(key);
            process.nextTick(delayed);
        }

        return this;
    }

    resetGenericPromissoryNotes() {
        console.log("Homebrew.resetGenericPromissoryNotes");

        if (world.TI4.config.timestamp > 0) {
            Broadcast.chatAll(
                locale("ui.error.homebrew.resetAfterLoaded"),
                Broadcast.ERROR
            );
            return;
        }

        const key = "resetGenericPromissoryNotes";
        const delayed = () => {
            this._pending.delete(key);

            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const setupGenericPromissory = new SetupGenericPromissory(
                    playerDesk
                );
                setupGenericPromissory.clean();

                // Gross hack.  Replace rules only apply AFTER game start.
                // Pretend like it has.
                world.TI4.config.setTimestamp(1);
                setupGenericPromissory.setup();
                world.TI4.config.setTimestamp(0);
            }
        };

        if (!this._pending.has(key)) {
            this._pending.add(key);
            process.nextTick(delayed);
        }

        return this;
    }

    /**
     * Create a box with extra content, add to the shaed "homebrew" box.
     *
     * @param {Array.{Object.{name:string,nsids:Array.{string}}}} extraBoxes
     */
    _delayedSpawnExtraBoxes(extraBoxes) {
        assert(Array.isArray(extraBoxes));
        for (const extraBox of extraBoxes) {
            assert(typeof extraBox === "object");
            assert(typeof extraBox.name === "string");
            assert(Array.isArray(extraBox.nsids));
            for (const nsid of extraBox.nsids) {
                assert(typeof nsid === "string");
            }
        }

        if (world.TI4.config.timestamp > 0) {
            Broadcast.chatAll(
                locale("ui.error.homebrew.resetAfterLoaded"),
                Broadcast.ERROR
            );
            return;
        }

        const spawnBox = (name, pos = undefined, rot = undefined) => {
            assert(typeof name === "string");
            if (!pos) {
                pos = new Vector(0, 0, world.getTableHeight() + 10);
            }
            if (!rot) {
                rot = new Rotator(0, 0, 0);
            }
            const box = Spawn.spawn("bag:base/generic", pos, rot);
            box.snapToGround();
            box.setName(name);
            box.setPrimaryColor([1, 1, 1, 1]);
            box.setScale([0.8, 0.8, 0.8]);
            return box;
        };

        const delayed = () => {
            if (!this._homebrewExtrasBox) {
                const hebSavedData = "__homebrewExtrasBox__";
                const skipContained = true;
                for (const obj of world.getAllObjects(skipContained)) {
                    if (obj.getSavedData() === hebSavedData) {
                        this._homebrewExtrasBox = obj;
                        break;
                    }
                }
                if (!this._homebrewExtrasBox) {
                    const anchor = TableLayout.anchor.strategy;
                    let pos = new Vector(0, 0, 0);
                    let rot = new Rotator(0, 0, 0);
                    pos = TableLayout.anchorPositionToWorld(anchor, pos);
                    rot = TableLayout.anchorRotationToWorld(anchor, rot);
                    this._homebrewExtrasBox = spawnBox("Homebrew", pos, rot);
                    this._homebrewExtrasBox.setSavedData(hebSavedData);
                }
            }

            for (const extraBox of extraBoxes) {
                console.log(
                    `Homebrew._delayedSpawnExtraBoxes: spawning "${extraBox.name}"`
                );
                const box = spawnBox(extraBox.name);
                for (const nsid of extraBox.nsids) {
                    const pos = new Vector(0, 0, 0);
                    const rot = new Rotator(0, 0, 0);
                    const obj = Spawn.spawn(nsid, pos, rot);
                    if (obj) {
                        box.addObjects([obj]);
                    } else {
                        console.log(
                            `Homebrew._delayedSpawnExtraBoxes: unknown "${nsid}"`
                        );
                    }
                }
                this._homebrewExtrasBox.addObjects([box]);
            }
        };
        process.nextTick(delayed);
    }
}

module.exports = { Homebrew };
