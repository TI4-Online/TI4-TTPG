require("../../global");
const assert = require("assert");
const { CommandToken } = require("./command-token");
const { MockGameObject, world } = require("../../wrapper/api");

it("getCommandSheetAndTokens", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            position: playerDesk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            position: playerDesk.center,
        })
    );

    const playerSlotToSheetAndTokens =
        CommandToken._getAllCommandSheetsAndTokens();
    world.__clear();

    const { commandSheet, commandTokens } =
        playerSlotToSheetAndTokens[playerDesk.playerSlot];
    assert(commandSheet);
    assert.equal(commandTokens.length, 1);
});

it("sortTokensByRegion", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            position: playerDesk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            position: playerDesk.center.add([8, 0, 0]),
        })
    );

    const playerSlotToSheetAndTokens =
        CommandToken._getAllCommandSheetsAndTokens();
    world.__clear();

    const sheetAndTokens = playerSlotToSheetAndTokens[playerDesk.playerSlot];
    CommandToken._sortTokensByRegion(sheetAndTokens);
    assert.equal(sheetAndTokens.tactics.length, 1);
});

it("getPlayerSlotToTokenCount", () => {
    const playerDesk = world.TI4.getAllPlayerDesks()[0];
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            position: playerDesk.center,
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            position: playerDesk.center.add([8, 0, 0]),
        })
    );

    const playerSlotToTokenCount = CommandToken.getPlayerSlotToTokenCount();
    world.__clear();

    const tokenCount = playerSlotToTokenCount[playerDesk.playerSlot];
    assert.equal(tokenCount.tactics, 1);
});
