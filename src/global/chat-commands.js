const assert = require("../wrapper/assert-wrapper");
const { Broadcast } = require("../lib/broadcast");
const HexSummaryUpdator = require("../lib/game-data/updator-hex-summary");
const { Player, globalEvents, world } = require("../wrapper/api");

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

    // Enalbe or disable perf monitoring.
    if (message === "!perf") {
        if (world.TI4.perfStats.isReporting()) {
            console.log("!perf stop reporting");
            world.TI4.perfStats.stopReporting();
        } else {
            console.log("!perf start reporting");
            world.TI4.perfStats.startReporting(player, 3000);
        }
    }
}

globalEvents.onChatMessage.add((player, message) => {
    consider(player, message);
});

globalEvents.onTeamChatMessage.add((player, team, message) => {
    consider(player, message);
});
