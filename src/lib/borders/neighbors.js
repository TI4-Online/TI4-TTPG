const assert = require("../../wrapper/assert-wrapper");
const { AdjacencyHyperlane } = require("../../lib/system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../../lib/system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../../lib/system/adjacency-wormhole");
const { Borders } = require("../../lib/borders/borders");
const { CardUtil } = require("../card/card-util");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

/**
 * Neighbors share a system or are in adjacent systems.
 */

class Neighbors {
    constructor() {
        throw new Error("static only");
    }

    static getNeighbors(playerSlot) {
        assert(typeof playerSlot === "number");

        // Who has control in each hex?
        const hexToPlayerSlotSet = {};
        Borders.getAllControlEntries().forEach((controlEntry) => {
            const entryHex = controlEntry.hex;
            const entryPlayerSlot = controlEntry.playerSlot;
            assert(typeof entryHex === "string");
            assert(typeof entryPlayerSlot === "number");
            let playerSlotSet = hexToPlayerSlotSet[entryHex];
            if (!playerSlotSet) {
                playerSlotSet = new Set();
                hexToPlayerSlotSet[entryHex] = playerSlotSet;
            }
            playerSlotSet.add(entryPlayerSlot);
        });

        // Tech makes Mecatol Rex a "control" point for neighbor testing.
        let iihqModernization = undefined;
        let mecatolRex = undefined;
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (
                nsid ===
                    "card.technology.yellow.keleres:codex.vigil/iihq_modernization" &&
                CardUtil.isLooseCard(obj)
            ) {
                iihqModernization = obj;
            } else if (nsid === "tile.system:base/18") {
                mecatolRex = obj;
            }
        }
        if (iihqModernization && mecatolRex) {
            let pos = mecatolRex.getPosition();
            const hex = Hex.fromPosition(pos);
            pos = iihqModernization.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            const playerSlot = closestDesk.playerSlot;
            const playerSlotSet = hexToPlayerSlotSet[hex];
            if (playerSlotSet) {
                playerSlotSet.add(playerSlot);
            }
        }

        // Which hexes does this player have control?
        const playerHexes = Object.entries(hexToPlayerSlotSet)
            .filter(([hex, playerSlotSet]) => {
                return playerSlotSet.has(playerSlot);
            })
            .map(([hex, playerSlotSet]) => {
                return hex;
            });

        // Get neighbor hexes (as well as original hexes).
        const allHexes = new Set();
        for (const hex of playerHexes) {
            allHexes.add(hex); // applies to ships *in* or adjacent to

            const adjNeighbor = new AdjacencyNeighbor(hex);
            for (const adjHex of adjNeighbor.getAdjacent()) {
                allHexes.add(adjHex);
            }

            // Non-ghosts are neighbors across a-b.  TODO How to check that?
            const adjWormhole = new AdjacencyWormhole(hex, playerSlot);
            for (const adjHex of adjWormhole.getAdjacent()) {
                allHexes.add(adjHex);
            }

            const adjHyperlane = new AdjacencyHyperlane(hex);
            for (const adjHex of adjHyperlane.getAdjacent()) {
                allHexes.add(adjHex);
            }
        }

        // Ok, get all neighbors.
        const neighborPlayerSlots = new Set();
        for (const hex of allHexes) {
            const playerSlotSet = hexToPlayerSlotSet[hex];
            if (!playerSlotSet) {
                continue;
            }
            for (const neighbor of playerSlotSet) {
                neighborPlayerSlots.add(neighbor);
            }
        }
        neighborPlayerSlots.delete(playerSlot);
        return [...neighborPlayerSlots];
    }
}

module.exports = { Neighbors };
