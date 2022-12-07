const assert = require("../../../wrapper/assert-wrapper");
const { DealDiscard } = require("../../../lib/card/deal-discard");
const { MonkeyUtil } = require("./monkey-util");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const {
    Button,
    CardHolder,
    CheckBox,
    ImageButton,
    globalEvents,
    world,
} = require("../../../wrapper/api");
const { Broadcast } = require("../../../lib/broadcast");

/**
 * Perform random actions, may find bugs as well as resource leaks.
 *
 * Example actions:
 * - (NEEDS SYNTHETIC EVENTS) Find a UI then click a button
 * - Find a deck deal a card
 * - Find a container remove an object
 * - Move an object
 * - Graveyard trash an object or card
 * - Change active turn
 */
class MonkeyEvent {
    /**
     * Click a random global UI element (button, checkbox).
     *
     * @returns {boolean} true if event triggered
     */
    static globalUiClick() {
        const candidates = MonkeyUtil.getClickableWidgets(world.getUIs());
        const candidate = MonkeyUtil.randomFrom(candidates);
        if (!candidate) {
            console.log("MonkeyEvent.globalUiClick: no widget");
            return false;
        }
        if (candidate instanceof Button || candidate instanceof ImageButton) {
            if (!candidate.onClicked.trigger) {
                console.log(
                    "MonkeyEvent.globalUiClick: button without trigger"
                );
                return false;
            }
            let name;
            if (candidate instanceof Button) {
                name = candidate.getText();
            } else if (candidate instanceof ImageButton) {
                name = "<image>";
            }
            Broadcast.chatAll(`MonkeyEvent.globalUiClick: button "${name}"`);
            const clickingPlayer = world.getAllPlayers()[0];
            candidate.onClicked.trigger(candidate, clickingPlayer);
            return true;
        } else if (candidate instanceof CheckBox) {
            const name = candidate.getText();
            Broadcast.chatAll(`MonkeyEvent.globalUiClick: checkbox "${name}"`);
            const isChecked = !candidate.isChecked();
            candidate.setIsChecked(isChecked); // triggers onCheckStateChanged event
            return true;
        } else {
            throw new Error("unknown candidate type");
        }
    }

    /**
     * Click a random object UI element (button, checkbox).
     *
     * @returns {boolean} true if event triggered
     */
    static objectUiClick() {
        const candidates = [];
        for (const obj of world.getAllObjects()) {
            const b = MonkeyUtil.getClickableWidgets(obj.getUIs());
            candidates.push(...b);
        }
        const candidate = MonkeyUtil.randomFrom(candidates);
        if (!candidate) {
            console.log("MonkeyEvent.objectUiClick: no widget");
            return false;
        }
        if (candidate instanceof Button || candidate instanceof ImageButton) {
            if (!candidate.onClicked.trigger) {
                console.log(
                    "MonkeyEvent.objectUiClick: button without trigger"
                );
                return false;
            }
            let name;
            if (candidate instanceof Button) {
                name = candidate.getText();
            } else if (candidate instanceof ImageButton) {
                name = "<image>";
            }
            Broadcast.chatAll(`MonkeyEvent.objectUiClick: button "${name}"`);
            const clickingPlayer = world.getAllPlayers()[0];
            candidate.onClicked.trigger(candidate, clickingPlayer);
            return true;
        } else if (candidate instanceof CheckBox) {
            const name = candidate.getText();
            Broadcast.chatAll(`MonkeyEvent.objectUiClick: checkbox "${name}"`);
            const isChecked = !candidate.isChecked();
            candidate.setIsChecked(isChecked); // triggers onCheckStateChanged event
            return true;
        } else {
            throw new Error("unknown candidate type");
        }
    }

    /**
     * Explicit event to click "close" buttons.
     *
     * @returns {boolean} true if event triggered
     */
    static clickCloseButton() {
        Broadcast.chatAll("MonkeyEvent.clickCloseButton");
        const candidates = MonkeyUtil.getClickableWidgets(
            world.getUIs()
        ).filter((widget) => {
            return (
                widget instanceof Button &&
                widget.getText().toLowerCase() === "close"
            );
        });
        const candidate = MonkeyUtil.randomFrom(candidates);
        if (!candidate) {
            console.log("MonkeyEvent.clickCloseButton: no widget");
            return false;
        }
        if (!candidate.onClicked.trigger) {
            console.log("MonkeyEvent.clickCloseButton: button without trigger");
            return false;
        }
        const clickingPlayer = world.getAllPlayers()[0];
        candidate.onClicked.trigger(candidate, clickingPlayer);
        return true;
    }

    /**
     * Deal an action card to a player.  If they have at least one in hand trash one.
     *
     * @returns {boolean} true if event triggered
     */
    static dealAndReplaceActionCard() {
        Broadcast.chatAll("MonkeyEvent.dealAndReplaceActionCard");

        // Find a card holder owned by a player.
        const cardHolders = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof CardHolder)) {
                continue;
            }
            if (obj.getOwningPlayerSlot() < 0) {
                continue;
            }
            cardHolders.push(obj);
        }
        if (cardHolders.length === 0) {
            console.log(
                "MonkeyEvent.dealAndReplaceActionCard: no card holders"
            );
            return false;
        }
        const cardHolder = MonkeyUtil.randomFrom(cardHolders);

        // Find and discard one action card if present.
        const actionCards = [];
        for (const card of cardHolder.getCards()) {
            const nsid = ObjectNamespace.getNsid(card);
            if (nsid.startsWith("card.action")) {
                actionCards.push(card);
            }
        }
        if (actionCards.length > 3) {
            const actionCard = MonkeyUtil.randomFrom(actionCards);
            const success = DealDiscard.discard(actionCard);
            assert(success);
        }

        // Deal a new action card.
        const nsidPrefix = "card.action";
        const count = 1;
        const playerSlot = cardHolder.getOwningPlayerSlot();
        const success = DealDiscard.deal(nsidPrefix, count, playerSlot);
        assert(success);

        return true;
    }

    /**
     * Move a unit from a unit bag to the table.  Return a unit to a bag.
     *
     * @returns {boolean} true if event triggered
     */
    static placeAndReplaceUnit() {
        Broadcast.chatAll("MonkeyEvent.placeAndReplaceUnit");

        // Return one unit if there is one.
        Broadcast.chatAll("MonkeyEvent.placeAndReplaceUnit: returning unit");
        const units = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (ObjectNamespace.isUnit(obj)) {
                units.push(obj);
            }
        }
        if (units.length > 100) {
            const unit = MonkeyUtil.randomFrom(units);
            const nsid = ObjectNamespace.getNsid(unit);
            Broadcast.chatAll(
                `MonkeyEvent.placeAndReplaceUnit: returning unit "${nsid}"`
            );

            // Trash unit.
            const container = undefined;
            const rejectedObjects = [unit];
            const player = undefined;
            globalEvents.TI4.onContainerRejected.trigger(
                container,
                rejectedObjects,
                player
            );
        }

        // Find a random unit bag.
        const unitBags = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!ObjectNamespace.isUnitBag(obj)) {
                continue;
            }
            if (obj.getNumItems() <= 0) {
                continue;
            }
            unitBags.push(obj);
        }
        if (unitBags.length === 0) {
            console.log("MonkeyEvent.placeAndReplaceUnit: no unit bags");
            return false;
        }
        const unitBag = MonkeyUtil.randomFrom(unitBags);

        // Draw one unit.
        const index = 0;
        const pos = [
            Math.random() * 100 - 50,
            Math.random() * 100 - 50,
            world.getTableHeight() + 10,
        ];
        Broadcast.chatAll("MonkeyEvent.placeAndReplaceUnit: drawing unit");
        const above = unitBag.getPosition().add([0, 0, 10]);
        const unit = unitBag.takeAt(index, above);
        unit.setPosition(pos);
        assert(unit);

        return true;
    }

    /**
     * Activate a system (moves pulsing UI).
     *
     * return {boolean} true if event triggered
     */
    static activateSystem() {
        const systemTiles = world.TI4.getAllSystemTileObjects();
        if (systemTiles.length === 0) {
            return false;
        }
        const systemTile = MonkeyUtil.randomFrom(systemTiles);
        const player = MonkeyUtil.randomFrom(world.getAllPlayers());
        globalEvents.TI4.onSystemActivated.trigger(systemTile, player);
        return true;
    }
}

module.exports = { MonkeyEvent };
