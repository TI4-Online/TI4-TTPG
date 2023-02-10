const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const {
    Color,
    Container,
    GameObject,
    Player,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

// Value that lets token be a little off sheet.
const ON_SHEET_DISTANCE_SQ = 90;

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

        const playerSlotToPlayerDesk = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerSlotToPlayerDesk[playerDesk.playerSlot] = playerDesk;
        }

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
                // There should be only one sheet per player slot.  BUT if
                // there is an another, keep the closest to player area.
                if (sheetAndTokens.commandSheet) {
                    const playerDesk = playerSlotToPlayerDesk[playerSlot];
                    if (playerDesk) {
                        const dNew = playerDesk.center.distance(
                            obj.getPosition()
                        );
                        const dCurrent = playerDesk.center.distance(
                            sheetAndTokens.commandSheet.getPosition()
                        );
                        if (dNew < dCurrent) {
                            sheetAndTokens.commandSheet = obj;
                        }
                    }
                } else {
                    sheetAndTokens.commandSheet = obj;
                }
            } else if (isToken) {
                sheetAndTokens.commandTokens.push(obj);
            }
        }
        return playerSlotToSheetAndTokens;
    }

    static _sortTokensByRegion(sheetAndTokens) {
        sheetAndTokens.tactics = [];
        sheetAndTokens.fleet = [];
        sheetAndTokens.strategy = [];

        if (!sheetAndTokens.commandSheet) {
            return; // no command sheet (players removed after elimination?)
        }

        for (const token of sheetAndTokens.commandTokens) {
            let pos = token.getPosition();
            pos = sheetAndTokens.commandSheet.worldPositionToLocal(pos);

            // COMMAND SHEET IS NOT CENTERED AT THE REGION CENTER.
            pos = pos.add([0, 0.96, 0]);
            pos.z = 0;

            const angle = (Math.atan2(pos.y, pos.x) * 180) / Math.PI;
            const dSq = pos.magnitudeSquared();
            token.__debug = `${pos.y}/${pos.x}=${angle} @ ${dSq}`;

            if (dSq > ON_SHEET_DISTANCE_SQ) {
                continue; // not close enough to command sheet
            }
            // Which region?
            if (-30 < angle && angle <= 30) {
                sheetAndTokens.tactics.push(token);
            } else if (30 < angle && angle <= 90) {
                sheetAndTokens.fleet.push(token);
            } else if (90 < angle && angle <= 150) {
                sheetAndTokens.strategy.push(token);
            }
        }
    }

    static debugHighlightTokens() {
        for (const obj of world.getAllObjects()) {
            if (!ObjectNamespace.isCommandToken(obj)) {
                continue;
            }
            obj.setPrimaryColor(new Color(0.5, 0.5, 0.5, 1));
        }

        const playerSlotToSheetAndTokens =
            CommandToken._getAllCommandSheetsAndTokens();
        for (const sheetAndTokens of Object.values(
            playerSlotToSheetAndTokens
        )) {
            CommandToken._sortTokensByRegion(sheetAndTokens);
            for (const token of sheetAndTokens.tactics) {
                token.setPrimaryColor(new Color(1, 0, 0, 1));
            }
            for (const token of sheetAndTokens.fleet) {
                token.setPrimaryColor(new Color(0, 1, 0, 1));
            }
            for (const token of sheetAndTokens.strategy) {
                token.setPrimaryColor(new Color(0, 0, 1, 1));
            }
        }

        for (const obj of world.getAllObjects()) {
            if (!ObjectNamespace.isCommandToken(obj)) {
                continue;
            }
            obj.setName(`DEBUG: ${obj.__debug}`);
        }
    }

    static getPlayerSlotToTokenCount() {
        const playerSlotToSheetAndTokens =
            CommandToken._getAllCommandSheetsAndTokens();
        const result = {};
        for (const [playerSlotStr, sheetAndTokens] of Object.entries(
            playerSlotToSheetAndTokens
        )) {
            CommandToken._sortTokensByRegion(sheetAndTokens);
            result[playerSlotStr] = {
                tactics: sheetAndTokens.tactics.length,
                fleet: sheetAndTokens.fleet.length,
                strategy: sheetAndTokens.strategy.length,
            };
        }
        return result;
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
     * Get a tactic token from the region on the command sheet.
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
        return sheetAndTokens.tactics[0];
    }

    /**
     * Get a strategy token from the region on the command sheet.
     *
     * @param {number} playerSlot
     * @returns {GameObject|undefined} strategy token, if present
     */
    static getStrategyToken(playerSlot) {
        assert(typeof playerSlot === "number");
        const playerSlotToSheetAndTokens =
            CommandToken._getAllCommandSheetsAndTokens(playerSlot);
        const sheetAndTokens = playerSlotToSheetAndTokens[playerSlot];
        if (!sheetAndTokens) {
            return;
        }
        assert(sheetAndTokens);
        CommandToken._sortTokensByRegion(sheetAndTokens);
        return sheetAndTokens.strategy[0];
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
            return token;
        }
    }

    static _placeTokenOnSystem(systemTileObj, commandToken, extraZ = 0) {
        assert(systemTileObj instanceof GameObject);
        assert(commandToken instanceof GameObject);

        // Drop at different positions but consistet for each player.
        const playerCount = world.TI4.config.playerCount;
        const playerSlot = commandToken.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const index = playerDesk ? playerDesk.index : 0;

        const r = 3.5;
        const phi = (Math.PI * 2 * index) / playerCount;
        let pos = new Vector(Math.cos(phi) * r, Math.sin(phi) * r, 0);
        pos = systemTileObj.localPositionToWorld(pos).add([0, 0, 10 + extraZ]);

        // Point toward center.
        const angle = (phi * 180) / Math.PI - 30;
        const rot = new Rotator(0, angle, 0);

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

        // Who already has tokens on the tile?
        const alreadyPresentPlayerSlots = new Set();
        const pos = systemTileObj.getPosition();
        const systemTileHex = Hex.fromPosition(pos);
        const playerSlotToSheetAndTokens =
            CommandToken._getAllCommandSheetsAndTokens();
        for (let [playerSlot, { commandTokens }] of Object.entries(
            playerSlotToSheetAndTokens
        )) {
            for (const commandToken of commandTokens) {
                const pos = commandToken.getPosition();
                const hex = Hex.fromPosition(pos);
                if (hex === systemTileHex) {
                    playerSlot = Number.parseInt(playerSlot); // object key become string
                    alreadyPresentPlayerSlots.add(playerSlot);
                    break;
                }
            }
        }

        let extraZ = 0;
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const deskSlot = playerDesk.playerSlot;
            if (deskSlot === playerSlot) {
                continue;
            }
            if (alreadyPresentPlayerSlots.has(deskSlot)) {
                continue;
            }
            const commandToken = CommandToken.getReinforcementsToken(deskSlot);
            if (!commandToken) {
                const msg = locale("ui.error.diplomacy_no_token", {
                    name: world.TI4.getNameByPlayerSlot(deskSlot),
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

    static spendStrategyToken(playerSlot, clickingPlayer) {
        assert(typeof playerSlot === "number");
        assert(clickingPlayer instanceof Player);

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const msgColor = playerDesk ? playerDesk.chatColor : undefined;

        const playerSlotToCommandTokenBag =
            CommandToken.getPlayerSlotToCommandTokenBag();
        const commandTokenBag = playerSlotToCommandTokenBag[playerSlot];
        if (!commandTokenBag) {
            const msg = locale("ui.error.missing_command_token_bag", {
                name: world.TI4.getNameByPlayerSlot(playerSlot),
            });
            Broadcast.chatOne(clickingPlayer, msg, msgColor);
            return false;
        }

        const strategyToken = CommandToken.getStrategyToken(playerSlot);
        if (!strategyToken) {
            const msg = locale("ui.error.strategy_no_token", {
                name: world.TI4.getNameByPlayerSlot(playerSlot),
            });
            Broadcast.chatAll(msg, msgColor);
            return false;
        }

        const animate = true;
        commandTokenBag.addObjects([strategyToken], 0, animate);

        const msg = locale("ui.message.command_tokens_inserted", {
            factionName: world.TI4.getNameByPlayerSlot(playerSlot),
            count: 1,
        });
        Broadcast.chatAll(msg, msgColor);
        return true;
    }
}

module.exports = { CommandToken };
