require("../../global"); // register world.TI4
const assert = require("assert");
const { GameData } = require("./game-data");
const { world } = require("../../wrapper/api");

it("constructor", () => {
    new GameData();
});

it("enable/disable", () => {
    new GameData().enable().disable();
});

it("url (standard)", () => {
    world.TI4.config.setTimestamp(0);
    const gameData = new GameData();
    assert.equal(
        gameData._getUrl(),
        "http://ti4-game-data.appspot.com/posttimestamp?timestamp=0"
    );
});

it("url (streamer key)", () => {
    world.TI4.config.setTimestamp(0);
    const gameData = new GameData();
    gameData.setStreamerOverlayKey("mykey");
    assert.equal(
        gameData._getUrl(),
        "http://ti4-game-data.appspot.com/postkey?timestamp=0&key=mykey"
    );
});

it("url (localhost)", () => {
    world.TI4.config.setTimestamp(0);
    const gameData = new GameData();
    gameData.setStreamerOverlayKey("localhost");
    assert.equal(
        gameData._getUrl(),
        "http://localhost:8080/postkey?timestamp=0&key=localhost"
    );
});

it("addExtra", () => {
    const gameData = new GameData();
    assert(!gameData._createGameDataShell().extra);

    gameData.addExtra("myKey", "myValue");
    assert.deepEqual(gameData._createGameDataShell().extra, {
        myKey: "myValue",
    });
});
