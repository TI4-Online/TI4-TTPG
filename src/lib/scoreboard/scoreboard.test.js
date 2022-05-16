const assert = require("assert");
const { MockGameObject, world } = require("../../wrapper/api");
const { Scoreboard } = require("./scoreboard");

it("getScoreboard", () => {
    const scoreboard = new MockGameObject({
        templateMetadata: "token:base/scoreboard",
    });

    world.__clear();
    world.__addObject(scoreboard);
    const found = Scoreboard.getScoreboard();
    world.__clear();

    assert.equal(found, scoreboard);
});
it("getScoreFromToken", () => {
    const scoreboard = new MockGameObject({
        templateMetadata: "token:base/scoreboard",
    });
    const token = new MockGameObject({});

    world.__clear();
    world.__addObject(scoreboard);
    world.__addObject(token);
    const score = Scoreboard.getScoreFromToken(scoreboard, token);
    world.__clear();

    // worldPositionToLocal always return origin, no fancy test
    assert.equal(score, 5);
});
