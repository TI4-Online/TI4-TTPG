require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-faction-name");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

it("player.factionName", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
    const desk = world.TI4.getAllPlayerDesks()[0];
    const sheet = new MockGameObject({
        templateMetadata: "sheet.faction:base/arborec",
        position: desk.center,
    });
    world.__addObject(sheet);

    // Tell Faction to invalidate any caches.
    const player = new MockPlayer();
    globalEvents.TI4.onFactionChanged.trigger(desk.playerSlot, player);

    UPDATOR(data);
    world.__clear();

    assert.equal(data.players[0].factionName, "Arborec");
});
