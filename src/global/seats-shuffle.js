const assert = require("../wrapper/assert-wrapper");
const { PlayerDesk } = require("../lib/player-desk/player-desk");
const { Shuffle } = require("../lib/shuffle");
const { Player, globalEvents, world } = require("../wrapper/api");

function consider(player, message) {
    assert(player instanceof Player);
    assert(typeof message === "string");

    if (message !== "!seats") {
        return;
    }

    const seatSlots = world.TI4.getAllPlayerDesks().map((desk) => {
        return desk.playerSlot;
    });
    const swapPlayers = world.getAllPlayers().filter((player) => {
        return seatSlots.includes(player.getSlot());
    });
    console.log(`!seats: |players|=${swapPlayers.length}`);

    for (const player of swapPlayers) {
        PlayerDesk.moveNewPlayerToNonSeatSlot(player);
    }

    // Swap slot and assign card holder.
    const desks = Shuffle.shuffle([...world.TI4.getAllPlayerDesks()]);
    for (const player of swapPlayers) {
        const desk = desks.pop();
        desk.seatPlayer(player);
    }
}

globalEvents.onChatMessage.add((player, message) => {
    consider(player, message);
});

globalEvents.onTeamChatMessage.add((player, team, message) => {
    consider(player, message);
});
