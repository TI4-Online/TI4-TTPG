const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { System } = require("../../lib/system/system");
const { ObjectType, world } = require("../../wrapper/api");

class SetupHomeSystem extends AbstractSetup {
    constructor(playerDesk, faction) {
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
        const nsids = new Set();
        nsids.add(
            `tile.system:${this.faction.nsidSource}/${this.faction.raw.home}`
        );
        if (this._faction.raw.homeSurrogate) {
            nsids.add(
                `tile.system:${this.faction.nsidSource}/${this.faction.raw.homeSurrogate}`
            );
        }

        // Spawn ("oops ALL X")
        let pos = this.playerDesk.center.add([0, 0, 5]);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;
        for (const nsid of nsids) {
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setObjectType(ObjectType.Regular);
            obj.setOwningPlayerSlot(playerSlot);
            pos = pos.add([0, 0, 2]);
        }
    }

    _cleanHomeSystemTile() {
        const deleSet = new Set();
        deleSet.add(
            `tile.system:${this.faction.nsidSource}/${this.faction.raw.home}`
        );
        if (this._faction.raw.homeSurrogate) {
            deleSet.add(
                `tile.system:${this.faction.nsidSource}/${this.faction.raw.homeSurrogate}`
            );
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
            if (deleSet.has(nsid)) {
                obj.destroy();
            }
        }
    }

    _setupPlanetCards() {
        const homeSystem = System.getByTileNumber(this.faction.raw.home);
        const planetNsidNames = new Set();
        for (const planet of homeSystem.planets) {
            planetNsidNames.add(planet.getPlanetNsidName());
        }

        // Spawn ("oops all X")
        const pos = this.playerDesk.center.add([0, 0, 10]);
        const rot = this.playerDesk.rot;

        // Spawn the decks, combine into one.
        const deck = this.spawnDecksThenFilter(
            pos,
            rot,
            "card.planet",
            (nsid) => {
                const parsed = ObjectNamespace.parseNsid(nsid);
                return planetNsidNames.has(parsed.name);
            }
        );
        const playerSlot = this.playerDesk.playerSlot;
        CardUtil.moveCardsToCardHolder(deck, playerSlot);
    }

    _cleanPlanetCards() {
        const homeSystem = System.getByTileNumber(this.faction.raw.home);
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
            card.destroy();
        }
    }
}

module.exports = { SetupHomeSystem };
