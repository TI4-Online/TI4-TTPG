const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { Facing } = require("../facing");
const { Faction } = require("../faction/faction");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { System } = require("./system");
const { GameObject, world } = require("../../wrapper/api");

/**
 * Get adjacent-via-wormhole hexes.
 */
class AdjacencyWormhole {
    /*
     * Constructor
     *
     * @param {string} hex
     * @param {number} playerSlot - adjacency from this player's perspective, -1 to ignore
     */
    constructor(hex, playerSlot) {
        assert(typeof hex === "string");
        assert(typeof playerSlot === "number");

        this._hex = hex;
        this._playerSlot = playerSlot;

        this._connected = {
            alpha: new Set(["alpha"]),
            beta: new Set(["beta"]),
            delta: new Set(["delta"]),
            gamma: new Set(["gamma"]),
        };

        this._hexToWormholes = {};
    }

    _updateConnectedForFaction() {
        const faction = Faction.getByPlayerSlot(this._playerSlot);
        if (faction) {
            for (const ability of faction.raw.abilities) {
                if (ability === "quantum_entanglement") {
                    this._connected.alpha.add("beta");
                    this._connected.beta.add("alpha");
                }
            }
        }
    }

    _updateConnectedForCards() {
        for (const obj of world.getAllObjects()) {
            if (!CardUtil.isLooseCard(obj)) {
                continue; // not a lone, faceup card on the table
            }
            const nsid = ObjectNamespace.getNsid(obj);
            this._updateConnectedForCardNsid(nsid);
        }
    }
    _updateConnectedForCardNsid(nsid) {
        if (nsid === "card.agenda:base/wormhole_reconstruction") {
            this._connected.alpha.add("beta");
            this._connected.beta.add("alpha");
        }

        if (nsid === "card.action:base/lost_star_chart") {
            this._connected.alpha.add("beta");
            this._connected.beta.add("alpha");
        }

        // Creuss agent, can be applied for any player.
        // "After a player activates a system that contains a non-delta
        // wormhole: You may exhaust this card; if you do, that system is
        // adjacent to all other systems that contain a wormhole during
        // this tactical action."
        if (nsid === "card.leader.agent.creuss:pok/emissary_taivra") {
            const activeObj = System.getActiveSystemTileObject();
            if (!activeObj) {
                return;
            }
            const system = System.getBySystemTileObject(activeObj);
            let nonDelta = false;
            for (const wormhole of system.wormholes) {
                if (wormhole !== "delta") {
                    nonDelta = true;
                    break;
                }
            }
            if (!nonDelta) {
                return;
            }

            // TODO XXX ACTIVE/IDLE
            // if ()

            this._connected.alpha.add("beta");
            this._connected.alpha.add("gamma");
            this._connected.alpha.add("delta");
            this._connected.beta.add("alpha");
            this._connected.beta.add("gamma");
            this._connected.beta.add("delta");
            this._connected.gamma.add("alpha");
            this._connected.gamma.add("beta");
            this._connected.gamma.add("delta");
        }
    }

    _updateHexToWormholeSystems() {
        for (const systemObject of System.getAllSystemTileObjects()) {
            const system = System.getBySystemTileObject(systemObject);
            for (const wormhole of system.wormholes) {
                this._updateHexToWormholeObj(systemObject, wormhole);
            }
        }
    }

    _updateHexToWormholeTokens() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "token.exploration:pok/ion_storm") {
                const wormhole = Facing.isFaceUp(obj) ? "alpha" : "beta";
                this._updateHexToWormholeObj(obj, wormhole);
            }
            if (nsid.startsWith("token.wormhole")) {
                const wormhole = ObjectNamespace.parseNsid(nsid).name;
                this._updateHexToWormholeObj(obj, wormhole);
            }
        }
    }

    _updateHexToWormholeObj(obj, wormhole) {
        assert(obj instanceof GameObject);
        assert(typeof wormhole === "string");
        const hex = Hex.fromPosition(obj.getPosition());
        let wormholeSet = this._hexToWormholes[hex];
        if (!wormholeSet) {
            wormholeSet = new Set();
            this._hexToWormholes[hex] = wormholeSet;
        }
        wormholeSet.add(wormhole);
    }

    /**
     * Get adjacent.
     *
     * @returns {Set.{string}} hex values
     */
    getAdjacent() {
        const adjacentHexSet = new Set();

        // Get wormholes in the given hex (and all other hexes).
        this._updateHexToWormholeSystems();
        this._updateHexToWormholeTokens();
        const hexWormholes = this._hexToWormholes[this._hex];
        if (!hexWormholes) {
            return adjacentHexSet;
        }

        // Apply connectivity, which wormholes connect?
        this._updateConnectedForFaction();
        this._updateConnectedForCards();
        const connectedWormholes = new Set();
        for (const wormhole of hexWormholes) {
            for (const connected of this._connected[wormhole]) {
                connectedWormholes.add(connected);
            }
        }

        // Which other hexes has a connected wormhole?
        for (const [hex, wormholes] of Object.entries(this._hexToWormholes)) {
            for (const connectedWormhole of connectedWormholes) {
                if (wormholes.has(connectedWormhole)) {
                    adjacentHexSet.add(hex);
                    break;
                }
            }
        }

        // Do not consider self adjacent.
        adjacentHexSet.delete(this._hex);

        return adjacentHexSet;
    }
}

module.exports = { AdjacencyWormhole };
