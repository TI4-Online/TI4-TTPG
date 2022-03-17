const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { Player, globalEvents, world } = require("../wrapper/api");

function consider(player, message) {
    assert(player instanceof Player);
    assert(typeof message === "string");

    if (!message.startsWith("!gamedata")) {
        return;
    }

    const parts = message
        .split(" ")
        .map((s) => {
            return s.trim();
        })
        .filter((s) => {
            return s.length > 0;
        });
    const key = parts[1];

    assert(world.TI4.gameData);
    if (key) {
        world.TI4.gameData.setStreamerOverlayKey(key);
        world.TI4.gameData.enable();
        Broadcast.chatAll(locale("ui.message.enabling_game_data"));
    } else {
        world.TI4.gameData.setStreamerOverlayKey();
        Broadcast.chatAll(locale("ui.message.disabling_game_data"));
    }

    console.log(`gamedata-key "${key}"`);
}

globalEvents.onChatMessage.add((player, message) => {
    consider(player, message);
});

globalEvents.onTeamChatMessage.add((player, team, message) => {
    consider(player, message);
});
