const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { Neighbors } = require("../../lib/borders/neighbors");
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

        // Make sure card is in player area.
        const pos = mabanCard.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!closestDesk || closestDesk.playerSlot !== player.getSlot()) {
            const playerName = world.TI4.getNameByPlayerSlot(player.getSlot());
            const msg = locale("ui.error.not_owner", { playerName });
            Broadcast.chatOne(player, msg);
            return false;
        }

        // Make sure commander is unlocked.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (
                nsid !== "card.leader.commander.naalu:codex.vigil/maban.omega"
            ) {
                continue;
            }
            if (!obj.isFaceUp()) {
                const msg = locale("ui.error.commander_locked");
                Broadcast.chatOne(player, msg);
                return false;
            }
        }

        return true;
    }

    static reportNeighborsPromissoryNotes(mabanCard, player) {
        console.log("MabanOmega.reportNeighborsPromissoryNotes");
        if (!MabanOmega.canUse(mabanCard, player)) {
            return;
        }

        // Get promissories by neighbor slot.
        const neighborPlayerSlots = Neighbors.getNeighbors(player.getSlot());
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
