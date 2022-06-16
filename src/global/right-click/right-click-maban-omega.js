const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AdjacencyHyperlane } = require("../../lib/system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../../lib/system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../../lib/system/adjacency-wormhole");
const { Borders } = require("../../lib/borders/borders");
const { Broadcast } = require("../../lib/broadcast");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    CardHolder,
    Player,
    globalEvents,
    world,
} = require("../../wrapper/api");

/**
 * Naalu commander omega "card.leader.commander.naalu:codex.vigil/maban.omega":
 * "At any time: You may look at your neighbors' hands of promissory notes
 * and the top and bottom card of the agenda deck"
 */

const ACTION_NAME_PROMISSORY = "*" + locale("ui.menu.maban_omega_promissory");
const ACTION_NAME_AGENDA = "*" + locale("ui.menu.maban_omega_agent");

class MabanOmega {
    constructor() {
        throw new Error("static only");
    }

    static isMabanOmegaOrAlliance(gameObject) {
        const nsid = ObjectNamespace.getNsid(gameObject);
        if (
            nsid === "card.leader.commander.naalu:codex.vigil/maban.omega" ||
            nsid === "card.alliance:codex.vigil/naalu.omega"
        ) {
            return true;
        }
        return false;
    }

    /**
     * Is the clicking player allowed to use this card?
     * For now just verify player area matches player.
     *
     * @param {Card} mabanCard
     * @param {Player} player
     */
    static canUse(mabanCard, player) {
        assert(mabanCard instanceof Card); // might be alliance
        assert(player instanceof Player);

        const pos = mabanCard.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (closestDesk && closestDesk.playerSlot === player.getSlot()) {
            return true;
        }
        const playerName = world.TI4.getNameByPlayerSlot(player.getSlot());
        const msg = locale("ui.error.not_owner", { playerName });
        Broadcast.chatOne(player, msg);
        return false;
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

        // Which hexes does this player have control?
        const playerHexes = Object.entries(hexToPlayerSlotSet)
            .filter(([hex, playerSlotSet]) => {
                return playerSlotSet.has(playerSlot);
            })
            .map(([hex, playerSlotSet]) => {
                return hex;
            });
        console.log(`ME ${JSON.stringify(playerHexes)}`);

        // Get neighbor hexes (as well as original hexes).
        const allHexes = new Set();
        for (const hex of playerHexes) {
            allHexes.add(hex); // applies to ships *in* or adjacent to

            const adjNeighbor = new AdjacencyNeighbor(hex);
            for (const adjHex of adjNeighbor.getAdjacent()) {
                allHexes.add(adjHex);
            }

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

    static reportNeighborsPromissoryNotes(mabanCard, player) {
        console.log("MabanOmega.reportNeighborsPromissoryNotes");
        if (!MabanOmega.canUse(mabanCard, player)) {
            return;
        }

        // Get promissories by neighbor slot.
        const neighborPlayerSlots = MabanOmega.getNeighbors(player.getSlot());
        const slotToPromissories = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof CardHolder)) {
                continue;
            }
            const slot = obj.getOwningPlayerSlot();
            if (slot < 0) {
                continue;
            }
            if (!neighborPlayerSlots.includes(slot)) {
                continue;
            }
            const promissories = [];
            slotToPromissories[slot] = promissories;
            for (const card of obj.getCards()) {
                const nsid = ObjectNamespace.getNsid(card);
                if (!nsid.startsWith("card.promissory")) {
                    continue;
                }
                const name = card.getCardDetails().name;
                promissories.push(name);
            }
        }

        // Format message.
        let content = [];
        for (const [slotStr, promissories] of Object.entries(
            slotToPromissories
        )) {
            const slot = parseInt(slotStr);
            const playerName = world.TI4.getNameByPlayerSlot(slot);
            const cardNames = promissories.join(", ");
            content.push(`${playerName}: ${cardNames}`);
        }
        if (content.length > 0) {
            content = "\n" + content.join("\n");
        } else {
            content = locale("ui.message.none");
        }

        const msg = locale("ui.message.maban_omega_promissory", { content });
        const color = [1, 1, 1, 1];
        player.sendChatMessage(msg, color);
    }

    static reportAgendaTopBottom(mabanCard, player) {
        console.log("MabanOmega.reportAgendaTopBottom");
        if (!MabanOmega.canUse(mabanCard, player)) {
            return;
        }
        const deck = DealDiscard.getDeckWithReshuffle("card.agenda");
        if (!deck) {
            return;
        }
        assert(deck instanceof Card);
        let top = deck.getCardDetails(deck.getStackSize() - 1);
        let bottom = deck.getCardDetails(0);
        top = top.name;
        bottom = bottom.name;
        const msg = locale("ui.message.maban_omega_agent", { top, bottom });
        const color = [1, 1, 1, 1];
        player.sendChatMessage(msg, color);
    }
}

// Below here is event managment, route to MabanOmega methods.

function onCustomActionHandler(obj, player, selectedActionName) {
    if (selectedActionName === ACTION_NAME_PROMISSORY) {
        MabanOmega.reportNeighborsPromissoryNotes(obj, player);
    } else if (selectedActionName === ACTION_NAME_AGENDA) {
        MabanOmega.reportAgendaTopBottom(obj, player);
    }
}

function addRightClickOptions(card) {
    assert(card instanceof Card);
    card.addCustomAction(ACTION_NAME_PROMISSORY);
    card.addCustomAction(ACTION_NAME_AGENDA);
    card.onCustomAction.remove(onCustomActionHandler);
    card.onCustomAction.add(onCustomActionHandler);
    card.__hasRightClickMabanOmegaOptions = true;
}

function removeRightClickOptions(card) {
    assert(card instanceof Card);
    card.removeCustomAction(ACTION_NAME_PROMISSORY);
    card.removeCustomAction(ACTION_NAME_AGENDA);
    card.onCustomAction.remove(onCustomActionHandler);
    card.__hasRightClickMabanOmegaOptions = false;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    if (MabanOmega.isMabanOmegaOrAlliance(card)) {
        addRightClickOptions(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasRightClickMabanOmegaOptions) {
        removeRightClickOptions(card);
    }
});

for (const obj of world.getAllObjects()) {
    if (MabanOmega.isMabanOmegaOrAlliance(obj)) {
        addRightClickOptions(obj);
    }
}
