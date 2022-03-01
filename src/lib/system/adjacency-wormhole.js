const assert = require("../../wrapper/assert-wrapper");
const { ActiveIdle } = require("../unit/active-idle");
const { CardUtil } = require("../card/card-util");
const { Facing } = require("../facing");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
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
        const faction = world.TI4.getFactionByPlayerSlot(this._playerSlot);
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
        const nsidSet = new Set([
            "card.agenda:base/wormhole_reconstruction",
            "card.action:base/lost_star_chart",
            "card.leader.agent.creuss:pok/emissary_taivra",
        ]);
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsidSet.has(nsid)) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, true)) {
                continue; // not a lone, faceup card on the table
            }
            this._updateConnectedForCardNsid(nsid, obj);
        }
    }

    _updateConnectedForCardNsid(nsid, obj) {
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
            const activeObj = world.TI4.getActiveSystemTileObject();
            if (!activeObj) {
                return;
            }
            const system = world.TI4.getSystemBySystemTileObject(activeObj);
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

            if (!ActiveIdle.isActive(obj)) {
                return; // not active
            }

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
        for (const systemObject of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(systemObject);
            for (const wormhole of system.wormholes) {
                this._addHexWormhole(systemObject, wormhole);
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
                this._addHexWormhole(obj, wormhole);
            }
            if (nsid.startsWith("token.wormhole")) {
                const wormhole = ObjectNamespace.parseNsid(nsid).name;
                this._addHexWormhole(obj, wormhole);
            }
        }
    }

    _updateHexToWormholeFlagship() {
        let flagshipPlayerSlot = -1;
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const deskPlayerSlot = playerDesk.playerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(deskPlayerSlot);
            if (faction && faction.raw.units.includes("hil_colish")) {
                flagshipPlayerSlot = deskPlayerSlot;
                break;
            }
        }
        if (flagshipPlayerSlot < 0) {
            return;
        }
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "unit:base/flagship") {
                continue; // not a flagship
            }
            if (obj.getOwningPlayerSlot() !== flagshipPlayerSlot) {
                continue; // flagship, but not correct owner
            }
            this._addHexWormhole(obj, "delta");
            // Do not break, allow multiple flagships!
        }
    }

    _addHexWormhole(obj, wormhole) {
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
        this._updateHexToWormholeFlagship();
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
