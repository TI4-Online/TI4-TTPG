const assert = require("../wrapper/assert-wrapper");
const { CardUtil } = require("../lib/card/card-util");
const { Faction } = require("../lib/faction/faction");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerDesk } = require("../lib/player-desk");
const { System } = require("../lib/system/system");
const { Card, world } = require("../wrapper/api");

/**
 * Remove a setup faction.
 */
class CleanFaction {
    /**
     * Constructor.
     *
     * @param {PlayerDeck} playerDesk
     * @param {string} factionNsidName - name portion "token.command:base/jolnar" -> "jolnar"
     */
    constructor(playerDesk, factionNsidName) {
        assert(playerDesk instanceof PlayerDesk);
        assert(typeof factionNsidName === "string");

        this._playerSlot = playerDesk.playerSlot;
        this._factionNsidName = factionNsidName;

        this._faction = Faction.getByNsidName(factionNsidName);
        assert(this._faction);

        this._extraNsids = new Set();

        const extra = this._faction.raw.unpackExtra;
        if (extra) {
            extra.forEach((extra) => {
                if (extra.tokenNsid) {
                    this._extraNsids.add(extra.tokenNsid);
                }
                if (extra.bagNsid) {
                    this._extraNsids.add(extra.bagNsid);
                }
            });
        }
    }

    /**
     * Remove the constructor-specified faction from the player desk/table.
     * This is only intended as an undo immediately after faction unpacking,
     * it should not be used once a game is in progress.
     */
    clean() {
        // Scan objects, look inside decks.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }

            // Clean command and control tokens anywhere on table.
            if (
                ObjectNamespace.isCommandToken(obj) ||
                ObjectNamespace.isControlToken(obj)
            ) {
                if (obj.getOwningPlayerSlot() === this._playerSlot) {
                    obj.destroy();
                }
                continue;
            }

            // Otherwise restrict to on-table, on-player-desk.
            const closestDesk = PlayerDesk.getClosest(obj.getPosition());
            if (closestDesk.playerSlot !== this._playerSlot) {
                continue;
            }

            if (obj instanceof Card && obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    if (this._shouldClean(nsid)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            //console.log(`${nsid}: ${i}/${obj.getStackSize()}`);
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
                        assert(cardObj instanceof Card);
                        cardObj.destroy();
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                if (this._shouldClean(nsid)) {
                    if (obj instanceof Card && obj.isInHolder()) {
                        obj.removeFromHolder();
                    }
                    obj.destroy();
                }
            }
        }

        this._returnUnits();
        this._returnPlanetCards();
        this._returnTechCards();
        this._returnSystemTiles();
    }

    _shouldClean(nsid) {
        const parsed = ObjectNamespace.parseNsid(nsid);

        // Sheet ("sheet.faction:base/x").
        if (nsid.startsWith("sheet.faction")) {
            const factionSlot = parsed.name.split(".")[0];
            return factionSlot === this._factionNsidName;
        }

        // Tech ("card.technology.red.muaat").
        if (nsid.startsWith("card.technology")) {
            const factionSlot = parsed.type.split(".")[3];
            return factionSlot === this._factionNsidName;
        }

        // Promissory ("card.promissory.jolnar").
        if (nsid.startsWith("card.promissory")) {
            const factionSlot = parsed.type.split(".")[2];
            return factionSlot === this._factionNsidName;
        }

        // Leader ("card.leader.agent.x").
        if (nsid.startsWith("card.leader")) {
            const factionSlot = parsed.type.split(".")[3];
            return factionSlot === this._factionNsidName;
        }

        // Alliance "card.alliance:pok/faction"
        if (nsid.startsWith("card.alliance")) {
            const factionSlot = parsed.name.split(".")[0];
            return factionSlot === this._factionNsidName;
        }

        // Command, control tokens.
        if (
            nsid.startsWith("token.command") ||
            nsid.startsWith("token.control")
        ) {
            const factionSlot = parsed.name.split(".")[0];
            return factionSlot === this._factionNsidName;
        }

        // Command, control token bags.  These are generic!
        if (
            nsid.startsWith("bag.token.command") ||
            nsid.startsWith("bag.token.control")
        ) {
            return true;
        }

        return this._extraNsids.has(nsid);
    }

    _returnUnits() {
        const unitToBag = {};
        const units = [];

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (ObjectNamespace.isUnitBag(obj)) {
                const parsed = ObjectNamespace.parseUnitBag(obj);
                unitToBag[parsed.unit] = obj;
            }
            if (ObjectNamespace.isUnit(obj)) {
                units.push(obj);
            }
        }

        for (const obj of units) {
            const parsed = ObjectNamespace.parseUnit(obj);
            const bag = unitToBag[parsed.unit];
            assert(bag);
            bag.addObjects([obj]);
        }
    }

    _returnPlanetCards() {
        const homeSystem = System.getByTileNumber(this._faction.raw.home);
        const planetNsidNames = new Set();
        for (const planet of homeSystem.planets) {
            planetNsidNames.add(planet.getPlanetNsidName());
        }
        const cards = CardUtil.gatherCards((nsid, cardOrDeckObj) => {
            if (!nsid.startsWith("card.planet")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            return planetNsidNames.has(parsed.name);
        });
        if (cards.length === 0) {
            return; // no planet cards??
        }
        const deck = CardUtil.makeDeck(cards);

        // TODO XXX MOVE TO PLANET DECK
        deck.setPosition([0, 0, world.getTableHeight() + 5], 1);
    }

    _returnTechCards() {
        // TODO XXX
    }

    _returnSystemTiles() {
        const nsids = new Set();
        nsids.add(
            `tile.system:${this._faction.raw.source}/${this._faction.raw.home}`
        );
        if (this._faction.raw.homeSurrogate) {
            nsids.add(
                `tile.system:${this._faction.raw.source}/${this._faction.raw.homeSurrogate}`
            );
        }
        const objs = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsids.has(nsid)) {
                objs.push(obj);
            }
        }

        // TODO XXX MOVE TO CONTAINER
        for (const obj of objs) {
            obj.setPosition([0, 0, world.getTableHeight() + 5], 1);
        }
    }
}

module.exports = { CleanFaction };
