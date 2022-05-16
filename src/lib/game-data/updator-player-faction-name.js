const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);

    data.players.forEach((playerData) => {
        playerData.factionName = "---";
        playerData.factionShort = "---"; // streamer overlay uses this
    });

    world.TI4.getAllPlayerDesks().forEach((playerDesk, index) => {
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerData = data.players[playerDesk.index];
        if (playerData && faction) {
            playerData.factionName = faction.nameAbbr;
            playerData.factionShort = faction.nameAbbr;
        }
    });
};
