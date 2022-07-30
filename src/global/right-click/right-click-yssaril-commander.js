const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    CardHolder,
    Player,
    globalEvents,
    world,
} = require("../../wrapper/api");

/**
 * Yssaril commander omega "card.leader.commander.yssaril:pok/so_ata":
 * "After another player activates a system that contains your units: You may
 * look at that player's action cards, promissory notes, or secret objectives."
 */

const ACTION_NAME_ACTIONS = "*" + locale("ui.menu.yssaril_commander_actions");
const ACTION_NAME_PROMISSORY =
    "*" + locale("ui.menu.yssaril_commander_promissory");
const ACTION_NAME_SECRETS = "*" + locale("ui.menu.yssaril_commander_secrets");

class YssarilCommander {
    constructor() {
        throw new Error("static only");
    }

    static isYssarilCommanderOrAlliance(gameObject) {
        const nsid = ObjectNamespace.getNsid(gameObject);
        if (
            nsid === "card.leader.commander.yssaril:pok/so_ata" ||
            nsid === "card.alliance:pok/yssaril"
        ) {
            return true;
        }
        return false;
    }

    /**
     * Is the clicking player allowed to use this card?
     * For now just verify player area matches player.
     *
     * @param {Card} card
     * @param {Player} player
     */
    static canUse(card, player) {
        assert(card instanceof Card); // might be alliance
        assert(player instanceof Player);

        // Make sure commander is unlocked.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "card.leader.commander.yssaril:pok/so_ata") {
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

    static reportCards(card, player, reportCardPrefix) {
        assert(card instanceof Card); // might be alliance
        assert(player instanceof Player);
        assert(typeof reportCardPrefix === "string");

        console.log("YssarilCommander.reportCards");
        if (!YssarilCommander.canUse(card, player)) {
            return;
        }

        // Get clicking player's card holder.
        let cardHolder = undefined;
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
            if (slot !== player.getSlot()) {
                continue;
            }
            cardHolder = obj;
            break;
        }

        assert(cardHolder);
        const cardNames = [];
        for (const card of cardHolder.getCards()) {
            const nsid = ObjectNamespace.getNsid(card);
            if (!nsid.startsWith(reportCardPrefix)) {
                continue;
            }
            const name = card.getCardDetails().name;
            cardNames.push(name);
        }

        // Format message.
        let content = cardNames.join(", ");
        if (content.length === 0) {
            content = locale("ui.message.none");
        }

        // Sent to player who has the card in their area, not the clicking player.
        const pos = card.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        let receiver = undefined;
        for (const candidate of world.getAllPlayers()) {
            if (candidate.getSlot() === closestDesk.playerSlot) {
                receiver = candidate;
                break;
            }
        }

        const srcName = world.TI4.getNameByPlayerSlot(player.getSlot());
        const dstName = world.TI4.getNameByPlayerSlot(closestDesk.playerSlot);
        const msg = locale("ui.message.yssaril_commander_broadcast", {
            srcName,
            dstName,
        });
        Broadcast.chatAll(msg);

        if (receiver) {
            const msg = locale("ui.message.yssaril_commander_report", {
                content,
            });
            const color = [1, 1, 1, 1];
            receiver.sendChatMessage(msg, color);
        }
    }
}

// Below here is event managment, route to static methods.

function onCustomActionHandler(obj, player, selectedActionName) {
    if (selectedActionName === ACTION_NAME_ACTIONS) {
        YssarilCommander.reportCards(obj, player, "card.action");
    } else if (selectedActionName === ACTION_NAME_PROMISSORY) {
        YssarilCommander.reportCards(obj, player, "card.promissory");
    } else if (selectedActionName === ACTION_NAME_SECRETS) {
        YssarilCommander.reportCards(obj, player, "card.objective.secret");
    }
}

function addRightClickOptions(card) {
    assert(card instanceof Card);
    const tooltip = locale("ui.tooltip.yssaril_commander");
    card.addCustomAction(ACTION_NAME_ACTIONS, tooltip);
    card.addCustomAction(ACTION_NAME_PROMISSORY, tooltip);
    card.addCustomAction(ACTION_NAME_SECRETS, tooltip);
    card.onCustomAction.remove(onCustomActionHandler);
    card.onCustomAction.add(onCustomActionHandler);
    card.__hasRightClickOptions = true;
}

function removeRightClickOptions(card) {
    assert(card instanceof Card);
    card.removeCustomAction(ACTION_NAME_ACTIONS);
    card.removeCustomAction(ACTION_NAME_PROMISSORY);
    card.removeCustomAction(ACTION_NAME_SECRETS);
    card.onCustomAction.remove(onCustomActionHandler);
    card.__hasRightClickOptions = false;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    if (YssarilCommander.isYssarilCommanderOrAlliance(card)) {
        addRightClickOptions(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasRightClickOptions) {
        removeRightClickOptions(card);
    }
});

for (const obj of world.getAllObjects()) {
    if (YssarilCommander.isYssarilCommanderOrAlliance(obj)) {
        addRightClickOptions(obj);
    }
}
