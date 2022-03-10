const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { DraftSelectionWidget } = require("./draft-selection-widget");
const { Button, Player, world } = require("../../wrapper/api");
const { ColorUtil } = require("../color/color-util");

/**
 * Track per-player selections.  Create a click handler for buttons to toggle them.
 */
class DraftSelectionManager {
    constructor() {
        this._categories = new Set();
        this._categoryNameToPlayerSlotToSelectionData = {};
        this._categoryNameToSelectionNameToDraftSelectionWidgets = {};
        this._borderSize = 4;
        this._onFinishedButtons = [];
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
        const categoryNames = Object.keys(
            this._categoryNameToPlayerSlotToSelectionData
        );
        for (const categoryName of categoryNames) {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const playerSlot = playerDesk.playerSlot;
                const selectionData = this.getSelectionData(
                    playerSlot,
                    categoryName
                );
                if (!selectionData) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Create a button (does not style it!) that gets enabled/disabled
     * when draft completes (or un-completed if a player reverts selection).
     *
     * @returns {Button}
     */
    createOnFinishedButton() {
        const button = new Button().setEnabled(false);
        this._onFinishedButtons.push(button);
        return button;
    }

    _clearDraftSelection(categoryName, selectionName) {
        assert(typeof categoryName === "string");
        assert(typeof selectionName === "string");

        const widgets =
            this._categoryNameToSelectionNameToDraftSelectionWidgets[
                categoryName
            ][selectionName];
        widgets.forEach((widget) => {
            widget.clearSelection();
        });
    }

    _setDraftSelection(categoryName, selectionName, color) {
        assert(typeof categoryName === "string");
        assert(typeof selectionName === "string");
        assert(ColorUtil.isColor(color));

        const widgets =
            this._categoryNameToSelectionNameToDraftSelectionWidgets[
                categoryName
            ][selectionName];
        widgets.forEach((widget) => {
            widget.setSelection(color);
        });
    }

    _updateFinish() {
        const isFinished = this.allPlayersHaveAllCategories();
        this._onFinishedButtons.forEach((button) => {
            button.setEnabled(isFinished);
        });
    }

    /**
     * Create a click handler that adds/removes a draft selection.
     * Requires button be a (potentially nested) DraftSelectionWidget child.
     *
     * Button seems to forget parent sometimes.  Instead of relying on
     * Button.getParent() create a generator to directly link the
     * DraftSelectionWidget.
     *
     * This is also nice because multiple UIs can register buttons here,
     * clicking the button on one affects all.
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

        let playerSlotToSelectionData =
            this._categoryNameToPlayerSlotToSelectionData[categoryName];
        if (!playerSlotToSelectionData) {
            playerSlotToSelectionData = {};
            this._categoryNameToPlayerSlotToSelectionData[categoryName] =
                playerSlotToSelectionData;
        }

        let selectionNameToDraftSelectionWidgets =
            this._categoryNameToSelectionNameToDraftSelectionWidgets[
                categoryName
            ];
        if (!selectionNameToDraftSelectionWidgets) {
            selectionNameToDraftSelectionWidgets = [];
            this._categoryNameToSelectionNameToDraftSelectionWidgets[
                categoryName
            ] = selectionNameToDraftSelectionWidgets;
        }
        let draftSelectionWidgets =
            selectionNameToDraftSelectionWidgets[selectionName];
        if (!draftSelectionWidgets) {
            draftSelectionWidgets = [];
            selectionNameToDraftSelectionWidgets[selectionName] =
                draftSelectionWidgets;
        }

        return (draftSelectionWidget) => {
            assert(draftSelectionWidget instanceof DraftSelectionWidget);

            // Setup and register widget.
            draftSelectionWidget.setBorderSize(this._borderSize);
            draftSelectionWidgets.push(draftSelectionWidget);

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

                // Player clicked an item but already have different one in
                // category.  Warn and ignore the click.
                const oldSelectionData = playerSlotToSelectionData[playerSlot];
                if (oldSelectionData && oldSelectionData !== selectionData) {
                    const msg = locale("ui.draft.already_have", {
                        playerName,
                        categoryName,
                    });
                    Broadcast.broadcastAll(msg, playerDesk.color);
                    return;
                }

                // Has another player already claimed it?
                for (const alreadySelectedData of Object.values(
                    playerSlotToSelectionData
                )) {
                    if (
                        !oldSelectionData &&
                        alreadySelectedData === selectionData
                    ) {
                        const msg = locale("ui.draft.already_claimed", {
                            playerName,
                            categoryName,
                            selectionName,
                        });
                        Broadcast.broadcastAll(msg, playerDesk.color);
                        return;
                    }
                }

                // Player clicked their existing selection, de-select it.
                // We may want to get clever and only let them undo their
                // immediately-preceeding selection without any other
                // different player selections, for now keep it simple.
                if (oldSelectionData === selectionData) {
                    playerSlotToSelectionData[playerSlot] = undefined;
                    this._clearDraftSelection(categoryName, selectionName);
                    this._updateFinish();
                    const msg = locale("ui.draft.deselected", {
                        playerName,
                        categoryName,
                        selectionName,
                    });
                    Broadcast.broadcastAll(msg, playerDesk.color);
                    return;
                }

                // Otherwise something is changing, change ALL linked
                // draftSelectionWidget buttons.

                // At this point the player chose in an unselected cateogry.
                playerSlotToSelectionData[playerSlot] = selectionData;
                this._setDraftSelection(
                    categoryName,
                    selectionName,
                    playerDesk.color
                );
                this._updateFinish();
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
