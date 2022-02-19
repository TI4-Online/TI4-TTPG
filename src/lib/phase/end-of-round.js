const { FindTurnOrder } = require("./find-turn-order");
const { ObjectNamespace } = require("../object-namespace");
const { Faction } = require("../faction/faction");
const { world, Vector, Rotator, Card } = require("../../wrapper/api");
const { System } = require("../system/system");
const assert = require("../../wrapper/assert-wrapper");
const { STRATEGY_CARDS } = require("../../setup/setup-strategy-cards");
const { Broadcast } = require("../broadcast");
const { PlayerDesk } = require("../player-desk");
const locale = require("../locale");

const ANIMATION_SPEED = 1;

class DealActionCards {
    constructor() {
        throw new Error("static only");
    }

    static getActionCardDeckAndDiscard() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "mat:base/decks") {
                const snapPoints = obj.getAllSnapPoints();

                // TODO: find another way to do this as the docs reads:
                // "[getSnappedObject] is not guaranteed to work correctly"
                const deck = snapPoints[3].getSnappedObject();
                const discard = snapPoints[0].getSnappedObject();

                if (!deck && !discard) {
                    Broadcast.chatAll(
                        "Missing both action card deck and pile!"
                    );
                    return;
                }

                if (deck) {
                    assert(deck instanceof Card);
                } else {
                    Broadcast.chatAll("Shuffling Action Card Discard Pile");
                    assert(discard instanceof Card);
                    discard.shuffle();
                    discard.setPosition(
                        snapPoints[3].getGlobalPosition(),
                        ANIMATION_SPEED
                    );
                    discard.snap();
                    discard.setRotation(
                        discard.getRotation().compose([-180, 0, 0]),
                        ANIMATION_SPEED
                    );
                    return { deck: discard, discard: null };
                }

                if (discard) {
                    assert(discard instanceof Card);
                }

                return { deck, discard };
            }
        }
    }

    /**
     * Gets the number of action cards to deal to the player in
     * playerSlot during the status phase.
     *
     * @param {number} playerSlot
     * @returns {number}
     */
    static getNumberActionCardsToDeal(playerSlot) {
        // TODO: does the player have neural motivator?
        assert(typeof playerSlot === "number");

        const faction = Faction.getByPlayerSlot(playerSlot);

        if (!faction) {
            throw `${playerSlot} does not have a faction!`;
        }

        let dealNCards = 1;
        if (faction.nsidName === "yssaril") {
            dealNCards++;
        }

        return dealNCards;
    }

    /**
     * Deals action cards to players in initiative order, reshuffling the discard
     * if necessary.
     */
    static dealToAll() {
        const actionCards = DealActionCards.getActionCardDeckAndDiscard();
        if (!actionCards) {
            throw "could not find action card mat.";
        }

        // get the color names for each slot for better broadcast messages
        const colorNames = Object.fromEntries(
            PlayerDesk.getAllPlayerDesks().map((element) => [
                element.playerSlot,
                element.colorName,
            ])
        );

        for (const playerSlot of FindTurnOrder.order()) {
            // TODO: why does FindTurnOrder.order() return strings?
            const slot = parseInt(playerSlot);

            const count = DealActionCards.getNumberActionCardsToDeal(slot);
            const message = locale("ui.message.deal_action_cards", {
                playerColor: colorNames[slot],
                count: count,
            });

            // trigger reshuffle before the deck is empty otherwise we wont be able
            // to add cards to the original deck
            if (actionCards.deck.getStackSize() > count) {
                Broadcast.chatAll(message);
                actionCards.deck.deal(count, [slot], false, true);
            } else {
                // shuffle discard and add to the back of the deck
                Broadcast.chatAll(locale("ui.message.shuffle_action_cards"));
                actionCards.discard.shuffle();
                actionCards.deck.addCards(actionCards.discard, true);

                Broadcast.chatAll(message);
                actionCards.deck.deal(count, [slot], false, true);
            }
        }
    }
}

class EndStatusPhase {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Gets the number of command tokens to distribute to the player
     * in playerSlot during the status phase.
     *
     * @param {number} playerSlot
     * @returns {number}
     */
    static getNumberOfCommandTokensToDistribute(playerSlot) {
        // TODO: does the player have hypermetabolism?
        assert(typeof playerSlot === "number");

        let dealNTokens = 2;
        const faction = Faction.getByPlayerSlot(playerSlot);

        if (!faction) {
            throw `${playerSlot} does not have a faction.`;
        }

        if (faction.nsidName === "sol") {
            dealNTokens++;
        }

        return dealNTokens;
    }
    /**
     * Repairs all ships that are on system tiles
     */
    static repairShips() {
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isUnit(obj)) {
                const pos = obj.getPosition();
                const systemObj = System.getSystemTileObjectByPosition(pos);

                // only repair ships that are on a system tile
                if (systemObj) {
                    const objRotation = obj.getRotation();
                    const repairedRotation = new Rotator(
                        objRotation.pitch,
                        objRotation.yaw,
                        0
                    );
                    obj.setRotation(repairedRotation, ANIMATION_SPEED);
                }
            }
        }
    }
    /**
     * Returns an object that maps player slots to their command token bags.
     *
     * @returns {{number: Container}}
     */
    static getCommandTokenBag(playerSlot) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue; // must be owned by player
            }
            if (ObjectNamespace.isCommandTokenBag(obj)) {
                return obj;
            }
        }
        throw `${playerSlot} does not have a command token bag.`;
    }
    /**
     * Places all command tokens that are on system tiles back in their proper
     * containers.
     */
    static returnCommandTokens() {
        // get all command token bags upfront so we don't have to refind them
        // with each command token we return
        const commandTokenBags = Object.fromEntries(
            world.TI4.getAllPlayerDesks().map((element) => [
                element.playerSlot,
                EndStatusPhase.getCommandTokenBag(element.playerSlot),
            ])
        );

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (ObjectNamespace.isCommandToken(obj)) {
                // only return command tokens that are on system tiles
                if (System.getSystemTileObjectByPosition(obj.getPosition())) {
                    const owningPlayerSlot = obj.getOwningPlayerSlot();
                    commandTokenBags[owningPlayerSlot].addObjects([obj]);
                }
            }
        }
    }
    /**
     * Distributes command tokens to all players.
     */
    static distributeCommandTokens() {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const commandTokenBag =
                EndStatusPhase.getCommandTokenBag(playerSlot);
            const count =
                EndStatusPhase.getNumberOfCommandTokensToDistribute(playerSlot);

            const message = locale("ui.message.distribute_command_tokens", {
                playerColor: playerDesk.colorName,
                count: count,
            });
            const errorMessage = locale(
                "ui.message.not_enough_command_tokens",
                {
                    playerColor: playerDesk.colorName,
                }
            );
            Broadcast.chatAll(message);

            for (let i = 0; i < count; i++) {
                if (commandTokenBag.getItems().length === 0) {
                    Broadcast.chatAll(errorMessage);
                    break;
                } else {
                    const dropPosition = playerDesk.localPositionToWorld(
                        new Vector(3, 20 + i * 1, 0)
                    );
                    commandTokenBag.takeAt(0, dropPosition, true);
                }
            }
        }
    }
    /**
     * Returns all strategy cards to their proper position and rotation.
     */
    static returnStrategyCards() {
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isStrategyCard(obj)) {
                const strategyCard = ObjectNamespace.parseStrategyCard(obj);
                const strategyCardHome = STRATEGY_CARDS.filter((element) =>
                    element.nsid.includes(strategyCard.card)
                )[0].pos;
                const strategyCardRotation = new Rotator(0, -90, 0);
                obj.setPosition(strategyCardHome, ANIMATION_SPEED);
                obj.setRotation(strategyCardRotation, ANIMATION_SPEED);
            }
        }
    }

    /**
     *  If the given card is not faceup, make it face up.
     * @param {Card} cardObj
     */
    static makeFaceUp(cardObj) {
        assert(cardObj instanceof Card);
        if (!cardObj.isFaceUp()) {
            const rotation = cardObj.getRotation();
            const newRotation = new Rotator(rotation.pitch, rotation.yaw, -180);
            cardObj.setRotation(newRotation, ANIMATION_SPEED);
        }
    }

    /**
     * Refreshes all planets (that are not on system tiles), technologies, agents
     * and relics.
     */
    static refreshCards() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore objects in containers
            }

            if (ObjectNamespace.isCard(obj)) {
                if (obj.getStackSize() > 1) {
                    continue; // don't care about stacks/decks
                }

                const card = ObjectNamespace.parseCard(obj);

                // refresh planets and legendary planet cards
                if (card.deck.includes("planet")) {
                    const pos = obj.getPosition();
                    const systemObj = System.getSystemTileObjectByPosition(pos);
                    // planet cards on map are unowned planets therefore don't refresh
                    if (!systemObj) {
                        EndStatusPhase.makeFaceUp(obj);
                    }
                }

                // refresh technology
                if (card.deck.includes("technology")) {
                    EndStatusPhase.makeFaceUp(obj);
                }

                // refresh relics: crown of emphidia, maw of worlds etc.
                if (card.deck.includes("relic")) {
                    EndStatusPhase.makeFaceUp(obj);
                }

                // refresh agents
                if (card.deck.includes("agent")) {
                    EndStatusPhase.makeFaceUp(obj);
                }
            }
        }
    }
}

module.exports = { DealActionCards, EndStatusPhase };
