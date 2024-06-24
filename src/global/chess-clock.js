const { globalEvents, world } = require("../wrapper/api");
const gameDataRound = require("../lib/game-data/updator-round");

console.log("chess clock: start");
const { ChessClock } = require("ttpg-darrell");

let currentPlayerSlot = -1;

// Create chess clock when game starts.
let chessClock;
function createChessClock() {
    console.log("createChessClock");
    chessClock = new ChessClock({
        playerSlotOrder: world.TI4.getAllPlayerDesks().map(
            (desk) => desk.playerSlot
        ),
        getCurrentPlayerSlot: () => {
            return currentPlayerSlot;
        },
        windowAnchor: { u: 1.1, v: 1.1 },
        windowPosition: { u: 1, v: 1 },
    });
}
if (world.TI4.config.timestamp > 0) {
    console.log("chess clock: game started, create now");
    createChessClock(); // re-attach if already started
} else {
    console.log("chess clock: wait for game start");
    globalEvents.TI4.onGameSetup.add(createChessClock);
}

// Widget color.
function updateWidgetColor() {
    if (chessClock) {
        world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
            const playerSlot = playerDesk.playerSlot;
            const widgetColor = playerDesk.widgetColor;
            chessClock
                .getChessClockData()
                .setWidgetColor(playerSlot, widgetColor);
        });
    }
}
updateWidgetColor();
globalEvents.TI4.onGameSetup.add(updateWidgetColor);
globalEvents.TI4.onPlayerColorChanged.add(updateWidgetColor);

// Open config window via "/chess" chat command.
globalEvents.onChatMessage.add((sender, message) => {
    if (chessClock && message === "/chess") {
        chessClock.openConfigWindow(sender);
    }
});

function getRound() {
    const gameData = {};
    gameDataRound(gameData);
    return gameData.round;
}
let lastRound = -1;

globalEvents.TI4.onActionTurnChanged.add((playerSlot, note, round) => {
    if (chessClock) {
        console.log(
            `chessClock onActionTurnChanged: playerSlot=${playerSlot}, note=${note}`
        );
        chessClock.getChessClockData().setCurrentTurn(playerSlot);
        currentPlayerSlot = playerSlot;

        const round = getRound();
        if (round !== lastRound) {
            lastRound = round;
            chessClock.getChessClockData().resetTimers();
        }
    }
});
