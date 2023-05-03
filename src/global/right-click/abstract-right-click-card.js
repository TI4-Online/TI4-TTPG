const assert = require("../../wrapper/assert-wrapper");
const { Card, globalEvents, world } = require("../../wrapper/api");

const _idToCustomActionNames = {};

/**
 * Manage adding/removing right click options for singleton cards.  Options get
 * added when removing a card from a deck, and removed when forming a deck.
 */
class AbstractRightClickCard {
    /**
     * Constructor.  Subclasses need to take card that other methods are safe
     * to call during `constructor.super()`!  There is a helpful `init()`
     * method subclasses can use to do any prior initialization.
     */
    constructor() {
        this._onCustomActionHandler = (card, player, actionName) => {
            this.onRightClick(card, player, actionName);
        };
        this.init();
        this._register(); // assumes ready to use!!
    }

    // --------------------------------

    /**
     * Subclasses should do setup here and not in constructor.
     */
    init() {}

    /**
     * Should this card get right click actions?
     *
     * @param {Card} card
     * @returns {boolean} true if should add actions
     */
    isRightClickable(card) {
        throw new Error("subclass should override");
    }

    /**
     * Get the array of right click action names.
     *
     * @param {Card} card
     * @returns {Array.{Object{actionName:string, tooltip:string}}} Right click actions
     */
    getRightClickActionNamesAndTooltips(card) {
        throw new Error("subclass should override");
    }

    /**
     * Handle a right click action.
     *
     * @param {Card} card
     * @param {Player} player
     * @param {string} selectedActionName
     */
    onRightClick(card, player, selectedActionName) {
        throw new Error("subclass should override");
    }

    // --------------------------------

    /**
     * Register event handlers, act on existing cards.
     */
    _register() {
        // Add/remove right click options.
        globalEvents.TI4.onSingletonCardCreated.add((card) => {
            this._maybeAddRightClickOptions(card);
        });
        globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
            this._maybeRemoveRightClickOptions(card);
        });
        for (const obj of world.getAllObjects()) {
            if (obj instanceof Card) {
                this._maybeAddRightClickOptions(obj);
            }
        }
    }

    _maybeAddRightClickOptions(card) {
        assert(card instanceof Card);

        if (!this.isRightClickable(card)) {
            return;
        }

        // Add action names (duplicates ignored).
        const actionNamesAndTooltips =
            this.getRightClickActionNamesAndTooltips(card);
        assert(Array.isArray(actionNamesAndTooltips));
        for (const { actionName, tooltip } of actionNamesAndTooltips) {
            assert(typeof actionName === "string");
            assert(!tooltip || typeof tooltip === "string");
            card.removeCustomAction(actionName);
            card.addCustomAction(actionName, tooltip);
        }

        // Remember action names for removal if card becomes a deck.
        const id = card.getId();
        if (!_idToCustomActionNames[id]) {
            _idToCustomActionNames[id] = [];
        }
        _idToCustomActionNames[id].push(
            ...actionNamesAndTooltips.map((x) => x.actionName)
        );

        // Watch out for accidental double add, always remove first.
        card.onCustomAction.remove(this._onCustomActionHandler);
        card.onCustomAction.add(this._onCustomActionHandler);

        // Record that this id is attached.  (It should not be already, but allow it.)
        if (!card._abstractRightClickCardIds) {
            card._abstractRightClickCardIds = [];
        }
        if (!card._abstractRightClickCardIds.includes(this._id)) {
            card._abstractRightClickCardIds.push(this._id);
        }
    }

    _maybeRemoveRightClickOptions(card) {
        assert(card instanceof Card);

        if (!card._abstractRightClickCardIds) {
            return;
        }
        if (!card._abstractRightClickCardIds.includes(this._id)) {
            return;
        }

        // This might be a deck, do not re-ask for action names
        // (because deck does not have a solitary NSID).  Use memory.
        const id = card.getId();
        const actionNames = _idToCustomActionNames[id] || [];
        delete _idToCustomActionNames[id];
        for (const actionName of actionNames) {
            assert(typeof actionName === "string");
            card.removeCustomAction(actionName);
        }
        card.onCustomAction.remove(this._onCustomActionHandler);
    }
}

module.exports = { AbstractRightClickCard };
