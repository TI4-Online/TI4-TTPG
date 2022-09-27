const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, CardHolder, Player, world } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

/**
 * Yssaril commander omega "card.leader.commander.yssaril:pok/so_ata":
 * "After another player activates a system that contains your units: You may
 * look at that player's action cards, promissory notes, or secret objectives."
 */

const ACTION_NAME_ACTIONS = "*" + locale("ui.menu.yssaril_commander_actions");
const ACTION_NAME_PROMISSORY =
    "*" + locale("ui.menu.yssaril_commander_promissory");
const ACTION_NAME_SECRETS = "*" + locale("ui.menu.yssaril_commander_secrets");

class YssarilCommander extends AbstractRightClickCard {
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
        const receiver = world.getPlayerBySlot(closestDesk.playerSlot);

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

    constructor() {
        super();
    }

    isRightClickable(card) {
        return YssarilCommander.isYssarilCommanderOrAlliance(card);
    }

    getRightClickActionNamesAndTooltips(card) {
        const tooltip = locale("ui.tooltip.yssaril_commander");
        return [
            { actionName: ACTION_NAME_ACTIONS, tooltip },
            { actionName: ACTION_NAME_PROMISSORY, tooltip },
            { actionName: ACTION_NAME_SECRETS, tooltip },
        ];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME_ACTIONS) {
            YssarilCommander.reportCards(card, player, "card.action");
        } else if (selectedActionName === ACTION_NAME_PROMISSORY) {
            YssarilCommander.reportCards(card, player, "card.promissory");
        } else if (selectedActionName === ACTION_NAME_SECRETS) {
            YssarilCommander.reportCards(card, player, "card.objective.secret");
        }
    }
}

new YssarilCommander();
