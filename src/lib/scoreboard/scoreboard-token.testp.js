const { Scoreboard } = require("./scoreboard");
const { refObject } = require("../../wrapper/api");

refObject.onReleased.add((obj) => {
    const scoreboard = Scoreboard.getScoreboard();
    const score = Scoreboard.getScoreFromToken(scoreboard, obj);
    console.log(`score: ${score}`);

    const playerSlotToScore = Scoreboard.getPlayerSlotToScore(scoreboard);
    console.log(`playerSlotToScore: ${JSON.stringify(playerSlotToScore)}`);
});
