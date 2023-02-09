const locale = require("../../lib/locale");
const { AbstractStrategyCard } = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { CommandToken } = require("../../lib/command-token/command-token");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { refObject, world, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.639, 0.627, 0.027))
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    )
    .addAutomatorButton(
        locale("strategy_card.automator.politics.draw_action_cards"),
        (playerDesk, player) => {
            const playerSlot = playerDesk.playerSlot;

            let count = 2;
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            if (faction && faction.raw.abilities.includes("scheming")) {
                count += 1;
            }
            const msg = locale("ui.message.deal_action_cards", {
                count,
                playerColor: world.TI4.getNameByPlayerSlot(playerSlot),
            });
            Broadcast.chatAll(msg, playerDesk.chatColor);

            const nsidPrefix = "card.action";
            DealDiscard.deal(nsidPrefix, count, playerSlot);
        }
    );
