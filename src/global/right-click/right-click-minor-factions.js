const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    ObjectType,
    Player,
    Rotator,
    Vector,
    world,
} = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");
const { Broadcast } = require("../../lib/broadcast");
const { Spawn } = require("../../setup/spawn/spawn");
const PositionToPlanet = require("../../lib/system/position-to-planet");
const { CardUtil } = require("../../lib/card/card-util");
const { SpawnDeck } = require("../../setup/spawn/spawn-deck");
const { Shuffle } = require("../../lib/shuffle");

/**
 * ACTION: ... roll 1 die, on a result of 1-4 draw a random unused red tile,
 * on a result of 5-10 draw a random unused blue tile; place that tile
 * adjacent to any border system that contains your ships.  Place a frontier
 * token in the newly placed system if it does not contain any planets.
 */
class RightClickMinorFactions extends AbstractRightClickCard {
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
            RightClickMinorFactions.getActiveFactionNsidNames();
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

    _minorFactions(obj, player) {
        const errorMsg = RightClickMinorFactions.getErrorMessage();
        if (errorMsg) {
            Broadcast.chatAll(`MINOR FACTIONS: ${errorMsg}`);
            return;
        }

        Broadcast.chatAll("MINOR FACTIONS: Generating...");
        const minorFactionNsidNames =
            RightClickMinorFactions.chooseMinorFactionNsidNames();
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

    constructor() {
        super();
    }

    isRightClickable(card) {
        assert(card instanceof Card);
        const parsedCard = ObjectNamespace.parseCard(card);
        const name = parsedCard?.name;
        return name && name.startsWith("minor_factions");
    }

    getRightClickActionNamesAndTooltips(card) {
        const actionName = "*Deal home systems";
        const tooltip = undefined;
        return [{ actionName, tooltip }];
    }

    onRightClick(card, player, selectedActionName) {
        assert(card instanceof Card);
        assert(player instanceof Player);
        assert(typeof selectedActionName === "string");

        const actionName = "*Deal home systems";
        if (selectedActionName === actionName) {
            this._minorFactions(card, player);
        }
    }
}

// Create and register self
new RightClickMinorFactions();
