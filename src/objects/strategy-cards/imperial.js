const locale = require("../../lib/locale");
const { AbstractStrategyCard } = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { CommandToken } = require("../../lib/command-token/command-token");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { refObject, world, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.317, 0.082, 0.403))
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    )
    .addAutomatorButton(
        locale("strategy_card.automator.imperial.draw_secret_objective"),
        (playerDesk, player) => {
            const count = 1;
            const playerSlot = playerDesk.playerSlot;
            const msg = locale("ui.message.deal_secret_cards", {
                count,
                playerColor: world.TI4.getNameByPlayerSlot(playerSlot),
            });
            Broadcast.chatAll(msg, playerDesk.chatColor);

            const nsidPrefix = "card.objective.secret";
            DealDiscard.deal(nsidPrefix, count, playerSlot);
        }
    );
