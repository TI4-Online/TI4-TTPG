const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { CloneReplace } = require("../../lib/card/clone-replace");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { SetupGenericHomeSystems } = require("../setup-generic-home-systems");
const { Spawn } = require("../spawn/spawn");
const { SpawnDeck } = require("../spawn/spawn-deck");
const { ObjectType, Rotator, world } = require("../../wrapper/api");

class SetupHomeSystem extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        this._setupHomeSystemTile();
        this._setupPlanetCards();
    }

    clean() {
        this._cleanHomeSystemTile();
        this._cleanPlanetCards();
    }

    _setupHomeSystemTile() {
        let onMapPos = SetupGenericHomeSystems.getHomeSystemPosition(
            this.playerDesk,
            false
        );
        const offMapPos = SetupGenericHomeSystems.getHomeSystemPosition(
            this.playerDesk,
            true
        );

        // Relace placeholder if present.
        const playerSlot = this.playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() != playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile.system:base/0") {
                continue;
            }
            onMapPos = obj.getPosition();
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
            break;
        }

        const tile = this.faction.raw.home;
        const system = world.TI4.getSystemByTileNumber(tile);
        const source = system.raw.source;
        assert(source);

        const nsidToPosition = {};
        const homeNsid = `tile.system:${source}/${this.faction.raw.home}`;
        let surrogateNsid = `tile.system:${source}/${this.faction.raw.homeSurrogate}`;
        if (this._faction.raw.homeSurrogate) {
            surrogateNsid = `tile.system:${source}/${this.faction.raw.homeSurrogate}`;
            nsidToPosition[homeNsid] = offMapPos;
            nsidToPosition[surrogateNsid] = onMapPos;
        } else {
            nsidToPosition[homeNsid] = onMapPos;
        }

        // Spawn ("oops ALL X")
        const rot = new Rotator(0, 0, 0);
        for (const [nsid, pos] of Object.entries(nsidToPosition)) {
            const above = pos.add([0, 0, 1]);
            const obj = Spawn.spawn(nsid, above, rot);
            obj.snapToGround();
            obj.setObjectType(ObjectType.Ground);
            obj.setOwningPlayerSlot(playerSlot);
        }
    }

    _cleanHomeSystemTile() {
        let replacePos = false;

        const tile = this.faction.raw.home;
        const system = world.TI4.getSystemByTileNumber(tile);
        const source = system.raw.source;
        assert(source);

        const homeNsid = `tile.system:${source}/${this.faction.raw.home}`;
        let surrogateNsid = `tile.system:${source}/${this.faction.raw.homeSurrogate}`;

        const deleSet = new Set();
        let replaceNsid;
        if (this._faction.raw.homeSurrogate) {
            deleSet.add(homeNsid);
            deleSet.add(surrogateNsid);
            replaceNsid = surrogateNsid;
        } else {
            deleSet.add(homeNsid);
            replaceNsid = homeNsid;
        }

        const playerSlot = this.playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!deleSet.has(nsid)) {
                continue;
            }

            if (nsid === replaceNsid) {
                replacePos = obj.getPosition();
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }

        // Restore placeholder.
        new SetupGenericHomeSystems(this.playerDesk).setup(replacePos);
    }

    _setupPlanetCards() {
        const homeSystem = world.TI4.getSystemByTileNumber(
            this.faction.raw.home
        );
        const planetNsidNames = new Set();
        for (const planet of homeSystem.planets) {
            planetNsidNames.add(planet.getPlanetNsidName());
        }

        // Spawn ("oops all X")
        const pos = this.playerDesk.center.add([0, 0, 10]);
        const rot = this.playerDesk.rot;

        // Spawn the decks, combine into one.
        const nsidPrefix = "card.planet";
        let deck = SpawnDeck.spawnDeck(nsidPrefix, pos, rot, (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            return planetNsidNames.has(parsed.name);
        });

        deck = CloneReplace.cloneReplace(deck);

        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    _cleanPlanetCards() {
        const homeSystem = world.TI4.getSystemByTileNumber(
            this.faction.raw.home
        );
        const planetNsidNames = new Set();
        for (const planet of homeSystem.planets) {
            planetNsidNames.add(planet.getPlanetNsidName());
        }

        const cards = CardUtil.gatherCards((nsid, cardOrDeckObj) => {
            if (!nsid.startsWith("card.planet")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!planetNsidNames.has(parsed.name)) {
                return false;
            }
            const pos = cardOrDeckObj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            return closestDesk === this.playerDesk;
        });
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            card.destroy();
        }
    }
}

module.exports = { SetupHomeSystem };
