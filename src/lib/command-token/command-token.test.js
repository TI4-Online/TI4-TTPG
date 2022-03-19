const assert = require("assert");
const { CommandToken } = require("./command-token");
const { MockGameObject, MockVector, world } = require("../../wrapper/api");

it("getCommandSheetAndTokens", () => {
    const slot = 7;
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            owningPlayerSlot: slot,
            position: new MockVector(0, 0, 0),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            owningPlayerSlot: slot,
            position: new MockVector(10, 0, 0),
        })
    );

    const playerSlotToSheetAndTokens =
        CommandToken._getAllCommandSheetsAndTokens();
    world.__clear();

    const { commandSheet, commandTokens } = playerSlotToSheetAndTokens[slot];
    assert(commandSheet);
    assert.equal(commandTokens.length, 1);
});

it("sortTokensByRegion", () => {
    const slot = 7;
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            owningPlayerSlot: slot,
            position: new MockVector(0, 0, 0),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            owningPlayerSlot: slot,
            position: new MockVector(10, 0, 0),
        })
    );

    const playerSlotToSheetAndTokens =
        CommandToken._getAllCommandSheetsAndTokens();
    world.__clear();

    const sheetAndTokens = playerSlotToSheetAndTokens[slot];
    CommandToken._sortTokensByRegion(sheetAndTokens);
    assert.equal(sheetAndTokens.tactics.length, 1);
});

it("getPlayerSlotToTokenCount", () => {
    const slot = 7;
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "sheet:base/command",
            owningPlayerSlot: slot,
            position: new MockVector(0, 0, 0),
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.command:base/arborec",
            owningPlayerSlot: slot,
            position: new MockVector(10, 0, 0),
        })
    );

    const playerSlotToTokenCount = CommandToken.getPlayerSlotToTokenCount();
    world.__clear();

    const tokenCount = playerSlotToTokenCount[slot];
    assert.equal(tokenCount.tactics, 1);
});
