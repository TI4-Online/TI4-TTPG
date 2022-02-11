const assert = require("../wrapper/assert-wrapper");
const { Faction } = require("../lib/faction/faction");
const { PlayerDesk } = require("../lib/player-desk");
const { ObjectNamespace } = require("../lib/object-namespace");
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

            // Clean owner tokens on table.
            if (ObjectNamespace.isControlToken(obj)) {
                if (obj.getOwningPlayerSlot() === this._playerSlot) {
                    obj.destroy();
                }
            }

            // Otherwise restrict to player desk.
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
                    obj.destroy();
                }
            }
        }
    }

    _shouldClean(nsid) {
        console.log("candidate " + nsid);
        const parsed = ObjectNamespace.parseNsid(nsid);

        // Placeholder faction sheet used during testing.
        // Remove this when real faction sheets are ready.
        if (nsid === "sheet.faction:base/???") {
            return true;
        }

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
}

module.exports = { CleanFaction };
