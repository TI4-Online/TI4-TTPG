const assert = require("../wrapper/assert-wrapper");
const { Broadcast } = require("../lib/broadcast");
const HexSummaryUpdator = require("../lib/game-data/updator-hex-summary");
const { Player, globalEvents } = require("../wrapper/api");

function consider(player, message) {
    assert(player instanceof Player);
    assert(typeof message === "string");

    // Shortcut for TI4 streamer buddy.
    if (message === "!summary") {
        const data = {};
        HexSummaryUpdator(data);
        const summary = data.hexSummary;
        if (summary) {
            Broadcast.chatAll(
                `summary: https://ti4-map.appspot.com/hexSummary?${summary}`
            );
        }
        return;
    }
}

globalEvents.onChatMessage.add((player, message) => {
    consider(player, message);
});

globalEvents.onTeamChatMessage.add((player, team, message) => {
    consider(player, message);
});
