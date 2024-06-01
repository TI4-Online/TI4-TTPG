const {
    ObjectType,
    Rotator,
    Vector,
    refObject,
    world,
} = require("../../wrapper/api");
const assert = require("../../wrapper/assert-wrapper");
const { Broadcast } = require("../broadcast");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const PositionToPlanet = require("../system/position-to-planet");
const { Shuffle } = require("../shuffle");
const { Spawn } = require("../../setup/spawn/spawn");
const { SpawnDeck } = require("../../setup/spawn/spawn-deck");

const SAVED_DATA_KEY = "minorFactionHomeSystemTileNumbers";
const ACTION_NAME = "*Spawn minor factions";

/**
 * Give each player:
 * - one unused home system,
 * - linked alliance card,
 * - 3 neutral infantry
 *
 * Minor faction planets have all traits.
 *
 * Existing Milty-EQ draft can leave EQs empty.
 */
class EventMinorFactions {
    _gameObject;

    static getErrorMessage() {
        const missingFactions = [];
        for (const desk of world.TI4.getAllPlayerDesks()) {
            const slot = desk.playerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(slot);
            if (!faction) {
                missingFactions.push(desk.colorName);
            }
        }
        if (missingFactions.length > 0) {
            return `All players must have factions (missing ${missingFactions.join(
                ", "
            )})`;
        }

        return false;
    }

    static getActiveFactionNsidNames() {
        const activeFactionNsidNames = [];
        for (const desk of world.TI4.getAllPlayerDesks()) {
            const slot = desk.playerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(slot);
            if (faction) {
                activeFactionNsidNames.push(faction.nsidName);
            }
        }
        return activeFactionNsidNames;
    }

    static chooseMinorFactionNsidNames() {
        const candidateNsidNames = new Set();

        // Get all non-active factions.
        const activeFactionNsidNames =
            EventMinorFactions.getActiveFactionNsidNames();
        for (const faction of world.TI4.getAllFactions()) {
            if (activeFactionNsidNames.includes(faction.nsidName)) {
                continue;
            }
            candidateNsidNames.add(faction.nsidName);
        }

        // Keleres headaches.
        if (activeFactionNsidNames.includes("keleres_argent")) {
            candidateNsidNames.delete("argent");
        }
        if (activeFactionNsidNames.includes("keleres_mentak")) {
            candidateNsidNames.delete("mentak");
        }
        if (activeFactionNsidNames.includes("keleres_xxcha")) {
            candidateNsidNames.delete("xxcha");
        }
        if (activeFactionNsidNames.includes("argent")) {
            candidateNsidNames.delete("keleres_argent");
        }
        if (activeFactionNsidNames.includes("mentak")) {
            candidateNsidNames.delete("keleres_mentak");
        }
        if (activeFactionNsidNames.includes("xxcha")) {
            candidateNsidNames.delete("keleres_xxcha");
        }
        if (
            activeFactionNsidNames.filter((name) => name.startsWith("keleres"))
                .length > 0
        ) {
            candidateNsidNames.delete("keleres_argent");
            candidateNsidNames.delete("keleres_mentak");
            candidateNsidNames.delete("keleres_xxcha");
        }

        // Keep only one Keleres.
        const keleresFlavors = Array.from(candidateNsidNames).filter((name) =>
            name.startsWith("keleres")
        );
        if (keleresFlavors.length > 0) {
            const keep = Math.floor(Math.random() * keleresFlavors.length);
            keleresFlavors.splice(keep, 1);
            for (const keleresFlavor of keleresFlavors) {
                candidateNsidNames.delete(keleresFlavor);
            }
        }

        console.log(
            `EventMinorFactions active: ${Array.from(
                activeFactionNsidNames
            ).join(", ")}`
        );
        console.log(
            `EventMinorFactions candidates: ${Array.from(
                candidateNsidNames
            ).join(", ")}`
        );

        let candidatesArray = Array.from(candidateNsidNames);
        candidatesArray = Shuffle.shuffle(candidatesArray);
        return candidatesArray.slice(0, world.TI4.config.playerCount);
    }

    constructor(gameObject) {
        this._gameObject = gameObject;

        gameObject.setDescription(
            [
                "After assigning main factions,",
                "right click to generate minor factions.",
                "",
                "Milty-EQ draft supports empty equidistants.",
                "",
                "Leave this card on the table to",
                "re-apply traits on reload",
            ].join("\n")
        );

        // Only apply context menu item if not already generated.
        const json = gameObject.getSavedData(SAVED_DATA_KEY);
        if (json && json.length > 0) {
            const tileNumbers = JSON.parse(json);
            for (const tileNumber of tileNumbers) {
                this._setAllPlanetTraits(tileNumber);
            }
        } else {
            gameObject.addCustomAction(ACTION_NAME);
            gameObject.onCustomAction.add((obj, player, actionName) => {
                if (actionName === ACTION_NAME) {
                    this._minorFactions(obj, player);
                }
            });
        }
    }

    _minorFactions(obj, player) {
        const errorMsg = EventMinorFactions.getErrorMessage();
        if (errorMsg) {
            Broadcast.chatAll(`MINOR FACTIONS: ${errorMsg}`);
            return;
        }

        Broadcast.chatAll("MINOR FACTIONS: Generating...");
        const minorFactionNsidNames =
            EventMinorFactions.chooseMinorFactionNsidNames();
        Broadcast.chatAll(`factions: ${minorFactionNsidNames.join(", ")}`);

        // Create alliance deck, destroy when done.
        let nsidPrefix = "card.alliance";
        const allianceDeck = SpawnDeck.spawnDeck(
            nsidPrefix,
            new Vector(0, 0, 20),
            new Rotator(0, 0, 0),
            (nsid) => {
                return true;
            }
        );

        // Create full planet deck, destroy when done.
        // (Home systems are not included in on-table deck.)
        // Planet cards do not normally exist.
        nsidPrefix = "card.planet";
        const planetDeck = SpawnDeck.spawnDeck(
            nsidPrefix,
            new Vector(0, 10, 20),
            new Rotator(0, 0, 0),
            (nsid) => {
                return true;
            }
        );

        const playerDesks = world.TI4.getAllPlayerDesks();
        assert(playerDesks.length === minorFactionNsidNames.length);
        for (let i = 0; i < playerDesks.length; i++) {
            const minorFactionNsidName = minorFactionNsidNames[i];
            const playerDesk = playerDesks[i];
            this._spawnFor(minorFactionNsidName, playerDesk);
        }

        allianceDeck.setTags(["DELETED_ITEMS_IGNORE"]);
        allianceDeck.destroy();

        planetDeck.setTags(["DELETED_ITEMS_IGNORE"]);
        planetDeck.destroy();
    }

    _spawnFor(minorFactionNsidName, playerDesk) {
        console.log(
            `EventMinorFactions: ${minorFactionNsidName} desk ${playerDesk.colorName}`
        );

        const pos = playerDesk.center.add([0, 0, 10]);
        const rot = new Rotator(0, 0, 0);

        // Spawn home system.
        const faction = world.TI4.getFactionByNsidName(minorFactionNsidName);
        const tileNumber = faction.home;
        const system = world.TI4.getSystemByTileNumber(tileNumber);
        const nsid = `tile.system:${system.raw.source}/${tileNumber}`;
        const systemTileObj = Spawn.spawn(nsid, pos, rot);
        systemTileObj.setObjectType(ObjectType.Regular);
        systemTileObj.snapToGround();

        // Spawn planet cards.
        console.log("minor factions spawning planet cards");
        for (const planet of system.planets) {
            const planetPos = PositionToPlanet.getWorldPosition(
                systemTileObj,
                planet.position
            );

            const planetCardNsid = planet.getPlanetCardNsid();

            const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
                return nsid === planetCardNsid;
            });
            if (cards && cards.length > 0) {
                const card = cards[0];
                card.setPosition(planetPos.add([0, 0, 3]));
                card.setRotation([0, 0, 0]);
                card.snapToGround();
            }
        }

        if (tileNumber === 51) {
            const nsid = `tile.system:base/17`;
            const surrogate = Spawn.spawn(nsid, pos, rot);
            surrogate.setObjectType(ObjectType.Regular);
            surrogate.snapToGround();
        }

        // Make trait updates persistent.
        let json = this._gameObject.getSavedData(SAVED_DATA_KEY);
        if (!json || json.length === 0) {
            json = "[]";
        }
        const tileNumbers = JSON.parse(json);
        tileNumbers.push(tileNumber);
        json = JSON.stringify(tileNumbers);
        this._gameObject.setSavedData(json, SAVED_DATA_KEY);

        this._setAllPlanetTraits(tileNumber);

        // Grab alliance card.  Careful, might have been replaced
        // by a codex (ignore source when searching).
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            // "card.alliance:pok/faction"
            if (!nsid.startsWith("card.alliance")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!parsed) {
                return false;
            }
            const name = parsed.name.split(".")[0];
            return name === minorFactionNsidName;
        });
        for (const card of cards) {
            card.setPosition(pos.add([0, 0, 3]));
            card.setRotation([0, 0, 180]);
            card.snapToGround();
        }

        // Neutral infantry.
        const infantryNsid = "unit:base/infantry";
        for (let i = 0; i < 3; i++) {
            const infantryPos = pos.add([0, -2 + i * 2, 3]);
            const infantry = Spawn.spawn(infantryNsid, infantryPos, rot);
            infantry.snapToGround();
            infantry.setPrimaryColor([0, 0, 0, 1]);
        }
    }

    _setAllPlanetTraits(tileNumber) {
        console.log(`EventMinorFactions._setAllPlanetTraits: ${tileNumber}`);

        const system = world.TI4.getSystemByTileNumber(tileNumber);
        for (const planet of system.planets) {
            let traits = planet.raw.trait;
            if (!traits) {
                traits = [];
                planet.raw.trait = traits;
            }
            if (!traits.includes("cultural")) {
                traits.push("cultural");
            }
            if (!traits.includes("industrial")) {
                traits.push("industrial");
            }
            if (!traits.includes("hazardous")) {
                traits.push("hazardous");
            }
        }
    }
}

new EventMinorFactions(refObject);
