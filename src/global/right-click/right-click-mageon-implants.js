const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, CardHolder, Player, world } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

/**
 * Mageon Implants "card.technology.green.yssaril:base/mageon_implants":
 * "ACTION: Exhaust this card to look at another player's hand of action cards.
 * Choose 1 of those cards and add it to your hand."
 */

const ACTION_NAME = "*" + locale("ui.menu.mageon_implants");
const TOOLTOP = locale("ui.tooltip.mageon_implants");

class RightClickMageonImplants extends AbstractRightClickCard {
    static isMageonImplants(gameObject) {
        const nsid = ObjectNamespace.getNsid(gameObject);
        return nsid === "card.technology.green.yssaril:base/mageon_implants";
    }

    static doMageonImplants(card, clickingPlayer) {
        assert(card instanceof Card);
        assert(clickingPlayer instanceof Player);

        const clickingName = world.TI4.getNameByPlayerSlot(
            clickingPlayer.getSlot()
        );

        // Sent to player who has the card in their area, not the clicking player.
        const pos = card.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        const receiverName = world.TI4.getNameByPlayerSlot(
            closestDesk.playerSlot
        );

        console.log(
            `RightClickMageonImplants.doMageonImplants: ${clickingName} reporting to ${receiverName}`
        );

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
            if (slot !== clickingPlayer.getSlot()) {
                continue;
            }
            cardHolder = obj;
            break;
        }
        assert(cardHolder);

        const cardNames = [];
        for (const card of cardHolder.getCards()) {
            const nsid = ObjectNamespace.getNsid(card);
            if (!nsid.startsWith("card.action")) {
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

        const msg = locale("ui.message.mageon_implants_broadcast", {
            srcName: clickingName,
            dstName: receiverName,
        });
        Broadcast.broadcastAll(msg);

        const receiver = world.getPlayerBySlot(closestDesk.playerSlot);
        if (receiver) {
            const msg = locale("ui.message.mageon_implants_report", {
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
        return RightClickMageonImplants.isMageonImplants(card);
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: TOOLTOP }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            RightClickMageonImplants.doMageonImplants(card, player);
        }
    }
}

new RightClickMageonImplants();
