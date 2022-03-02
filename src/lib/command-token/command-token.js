const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const {
    Container,
    GameObject,
    Player,
    Rotator,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");
const { CloneReplace } = require("../clone-replace");

// 15 is somewhat generous but nowhere near map area.
const ON_SHEET_DISTANCE_SQ = 225;

/**
 * Find command tokens on the command sheet or reinforcements.
 */
class CommandToken {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Gather all command sheets and tokens.
     * Optionally restrict to a single player slot.
     *
     * @param {number|undefined} restrictToSlot - optional, only find for this slot
     * @returns {object}
     */
    static _getAllCommandSheetsAndTokens(restrictToSlot = undefined) {
        assert(!restrictToSlot || typeof restrictToSlot === "number");

        const playerSlotToSheetAndTokens = {};

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }

            const playerSlot = obj.getOwningPlayerSlot();
            if (playerSlot < 0) {
                continue;
            }
            if (restrictToSlot && playerSlot !== restrictToSlot) {
                continue;
            }

            const isSheet = ObjectNamespace.isCommandSheet(obj);
            const isToken = ObjectNamespace.isCommandToken(obj);
            if (!isSheet && !isToken) {
                continue;
            }

            // At this point owned and either a sheet or a token.
            // Get or create the result entry.
            let sheetAndTokens = playerSlotToSheetAndTokens[playerSlot];
            if (!sheetAndTokens) {
                sheetAndTokens = {
                    commandSheet: false,
                    commandTokens: [],
                };
                playerSlotToSheetAndTokens[playerSlot] = sheetAndTokens;
            }

            if (isSheet) {
                assert(!sheetAndTokens.commandSheet);
                sheetAndTokens.commandSheet = obj;
            } else if (isToken) {
                sheetAndTokens.commandTokens.push(obj);
            }
        }
        return playerSlotToSheetAndTokens;
    }

    static _sortTokensByRegion(sheetAndTokens) {
        assert(sheetAndTokens.commandSheet);

        sheetAndTokens.tactic = [];
        sheetAndTokens.fleet = [];
        sheetAndTokens.strategy = [];

        for (const token of sheetAndTokens.commandTokens) {
            let pos = token.getPosition();
            pos = sheetAndTokens.commandSheet.worldPositionToLocal(pos);
            const dSq = pos.magnitudeSquared();
            if (dSq > ON_SHEET_DISTANCE_SQ) {
                continue; // not close enough to command sheet
            }
            // Which region?
            let angle = (Math.atan2(pos.y, pos.x) * 180) / Math.PI;
            if (-30 < angle && angle <= 30) {
                sheetAndTokens.tactic.push(token);
            } else if (30 < angle && angle <= 90) {
                sheetAndTokens.fleet.push(token);
            } else if (90 < angle && angle <= 150) {
                sheetAndTokens.strategy.push(token);
            }
        }
    }

    /**
     * Get a tactic token.
     *
     * @param {number} playerSlot
     * @returns {GameObject|undefined} tactic token, if present
     */
    static getTacticToken(playerSlot) {
        assert(typeof playerSlot === "number");
        const playerSlotToSheetAndTokens =
            CommandToken._getAllCommandSheetsAndTokens(playerSlot);
        const sheetAndTokens = playerSlotToSheetAndTokens[playerSlot];
        if (!sheetAndTokens) {
            return;
        }
        assert(sheetAndTokens);
        CommandToken._sortTokensByRegion(sheetAndTokens);
        return sheetAndTokens.tactic[0];
    }

    static getPlayerSlotToCommandTokenBag() {
        const playerSlotToCommandTokenBag = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Container)) {
                continue;
            }
            if (!ObjectNamespace.isCommandTokenBag(obj)) {
                continue;
            }
            const playerSlot = obj.getOwningPlayerSlot();
            if (playerSlot < 0) {
                continue;
            }
            playerSlotToCommandTokenBag[playerSlot] = obj;
        }
        return playerSlotToCommandTokenBag;
    }

    /**
     * Get a reinforcements token from the bag.
     *
     * @param {number} playerSlot
     * @returns {GameObject|undefined} reinforcements token, if present
     */
    static getReinforcementsToken(playerSlot) {
        let commandTokenBag =
            CommandToken.getPlayerSlotToCommandTokenBag()[playerSlot];
        if (!commandTokenBag) {
            return;
        }
        if (commandTokenBag.getNumItems() > 0) {
            let token = commandTokenBag.getItems()[0];
            const above = commandTokenBag.getPosition().add([0, 0, 10]);
            commandTokenBag.take(token, above, false);
            token = CloneReplace.cloneReplace(token);
            return token;
        }
    }

    static _placeTokenOnSystem(systemTileObj, commandToken, extraZ = 0) {
        assert(systemTileObj instanceof GameObject);
        assert(commandToken instanceof GameObject);

        const pos = systemTileObj.localPositionToWorld([0, -4.7, 10 + extraZ]);
        let numTokens = 0;
        const src = pos.add([0, 0, 50]);
        const dst = pos.subtract([0, 0, 50]);
        const hits = world.lineTrace(src, dst);
        for (const hit of hits) {
            if (ObjectNamespace.isCommandToken(hit.object)) {
                numTokens += 1;
            }
        }
        const rot = new Rotator(0, numTokens * 20, 0);
        commandToken.setPosition(pos, 1);
        commandToken.setRotation(rot, 1);
    }

    static activateSystem(systemTileObj, player) {
        assert(systemTileObj instanceof GameObject);
        assert(player instanceof Player);
        const playerSlot = player.getSlot();
        const commandToken = CommandToken.getTacticToken(playerSlot);
        if (!commandToken) {
            console.log("activateSystem: no tactic token");
            const msg = locale("ui.error.no_tactic_token");
            player.showMessage(msg);
            return;
        }

        CommandToken._placeTokenOnSystem(systemTileObj, commandToken);

        // Trigger activation.
        globalEvents.TI4.onSystemActivated.trigger(systemTileObj, player);
    }

    static diplomacySystem(systemTileObj, player) {
        assert(systemTileObj instanceof GameObject);
        assert(player instanceof Player);
        const playerSlot = player.getSlot();

        let extraZ = 0;
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const deskSlot = playerDesk.playerSlot;
            if (deskSlot === playerSlot) {
                continue;
            }
            const commandToken = CommandToken.getReinforcementsToken(deskSlot);
            if (!commandToken) {
                const msg = locale("ui.error.diplomacy_no_token", {
                    name: deskSlot.colorName,
                });
                Broadcast.broadcastAll(msg);
                continue;
            }
            CommandToken._placeTokenOnSystem(
                systemTileObj,
                commandToken,
                extraZ
            );
            extraZ += 1;
        }
    }
}

module.exports = { CommandToken };
