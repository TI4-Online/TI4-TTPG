const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { DraftSelectionWidget } = require("./draft-selection-widget");
const { Button, Player, world } = require("../../wrapper/api");

/**
 * Track per-player selections.  Create a click handler for buttons to toggle them.
 */
class DraftSelectionManager {
    constructor() {
        this._categories = new Set();
        this._categoryNameToPlayerSlotToSelectionData = {};
        this._borderSize = 4;
    }

    /**
     * Set a uniform border size.
     *
     * @param {number} borderSize
     * @returns {DraftSelectionManager} self, for chaining
     */
    setBorderSize(borderSize) {
        assert(typeof borderSize === "number");
        this._borderSize = borderSize;
        return this;
    }

    /**
     * Register cateory name.  All players must have selection in each category.
     *
     * @param {string} categoryName
     * @returns {DraftSelectionManager} self, for chaining
     */
    addCategory(categoryName) {
        assert(typeof categoryName === "string");
        assert(!this._categories.has(categoryName));
        this._categories.add(categoryName);

        // Fill in storage path.
        const playerSlotToSelectionData = {};
        this._categoryNameToPlayerSlotToSelectionData[categoryName] =
            playerSlotToSelectionData;
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            playerSlotToSelectionData[playerSlot] = undefined;
        }
        return this;
    }

    /**
     * What dis this player select?
     *
     * @param {number} playerSlot
     * @param {string} categoryName
     * @returns {?} selectionData given to createOnClickedHandler
     */
    getSelectionData(playerSlot, categoryName) {
        assert(typeof playerSlot === "number");
        assert(typeof categoryName === "string");

        const playerSlotToSelectionData =
            this._categoryNameToPlayerSlotToSelectionData[categoryName];
        assert(playerSlotToSelectionData);
        return playerSlotToSelectionData[playerSlot];
    }

    /**
     * Do all players have a selection in each category?
     *
     * @returns {boolean}
     */
    allPlayersHaveAllCategories() {
        for (const categoryName of this._categories) {
            const playerSlotToSelectionData =
                this._categoryNameToPlayerSlotToSelectionData[categoryName];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const playerSlot = playerDesk.playerSlot;
                if (!playerSlotToSelectionData[playerSlot]) {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * Create a click handler that adds/removes a draft selection.
     * Requires button be a (potentially nested) DraftSelectionWidget child.
     *
     * Button seems to forget parent sometimes.  Instead of relying on
     * Button.getParent() create a generator to directly link the
     * DraftSelectionWidget.
     *
     * @param {string} categoryName
     * @param {string} selectionName
     * @param {?} selectionData - opaque data, use getSelection to read
     * @returns {function} Button.onClicked GENERATOR.
     */
    createOnClickedGenerator(categoryName, selectionName, selectionData) {
        assert(typeof categoryName === "string");
        assert(typeof selectionName === "string");
        assert(selectionData); // could be anything, but must be something

        assert(this._categories.has(categoryName));
        const playerSlotToSelectionData =
            this._categoryNameToPlayerSlotToSelectionData[categoryName];

        return (draftSelectionWidget) => {
            assert(draftSelectionWidget instanceof DraftSelectionWidget);
            draftSelectionWidget.setBorderSize(this._borderSize);
            return (button, player) => {
                assert(button instanceof Button);
                assert(player instanceof Player);

                const playerName = player.getName();

                // Verify seated player.
                const playerSlot = player.getSlot();
                const playerDesk =
                    world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
                if (!playerDesk) {
                    console.log(
                        "DraftSelectionManager.onClicked no player desk"
                    );
                    const msg = locale("ui.draft.not_seated", { playerName });
                    Broadcast.broadcastAll(msg);
                    return;
                }

                // Don't be clever (yet), allow players to undo at any time.
                // This probably wants to prevent undo except for last selection.
                const oldSelectionData = playerSlotToSelectionData[playerSlot];

                // Player clicked their existing selection?
                if (oldSelectionData === selectionData) {
                    playerSlotToSelectionData[playerSlot] = undefined;
                    draftSelectionWidget.clearSelection();
                    const msg = locale("ui.draft.deselected", {
                        playerName,
                        categoryName,
                        selectionName,
                    });
                    Broadcast.broadcastAll(msg, playerDesk.color);
                    return;
                }

                // Cannot pick a new entry in an already-selected category.
                if (oldSelectionData) {
                    const msg = locale("ui.draft.already_have", {
                        playerName,
                        categoryName,
                    });
                    Broadcast.broadcastAll(msg, playerDesk.color);
                    return;
                }

                // At this point the player chose in an unselected cateogry.
                playerSlotToSelectionData[playerSlot] = selectionData;
                draftSelectionWidget.setColor(playerDesk.color);
                const msg = locale("ui.draft.selected", {
                    playerName,
                    categoryName,
                    selectionName,
                });
                Broadcast.broadcastAll(msg, playerDesk.color);
            };
        };
    }
}

module.exports = { DraftSelectionManager };
