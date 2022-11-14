const locale = require("../../lib/locale");
const { AbstractStrategyCard } = require("./abstract-strategy-card");
const { CommandToken } = require("../../lib/command-token/command-token");
const { refObject, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject)
    .setColor(new Color(0, 0.56, 0.835))
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    );
