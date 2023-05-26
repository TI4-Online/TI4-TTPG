const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { AgendaOutcome } = require("./agenda-outcome");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { CardUtil } = require("../card/card-util");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const {
    Card,
    Player,
    Rotator,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");

const _injectedVoteCountModifiers = [];

/**
 * Shared information about the current agenda.
 */
class Agenda {
    /**
     * Homebrew vote count manipulation.
     *
     * @param {function} voteCountModifier - takes playerDesk as arg, return delta
     */
    static injectVoteCountModifier(voteCountModifier) {
        assert(typeof voteCountModifier === "function");
        _injectedVoteCountModifiers.push(voteCountModifier);
    }

    static getDeskIndexToPerPlanetBonus() {
        const deskIndexToPerPlanetBonus = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            deskIndexToPerPlanetBonus[playerDesk.index] = 0;
        }

        let xxchaCommanderIndex = -1;
        let xxchaAllianceIndex = -1;

        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "card.leader.commander.xxcha:pok/elder_qanoj") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaCommanderIndex = closestDesk.index;
            } else if (nsid === "card.alliance:pok/xxcha") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaAllianceIndex = closestDesk.index;
            }
        }

        if (xxchaCommanderIndex >= 0) {
            deskIndexToPerPlanetBonus[xxchaCommanderIndex] = 1;

            // Alliance only applies if commander is unlocked.
            if (
                xxchaAllianceIndex >= 0 &&
                xxchaAllianceIndex != xxchaCommanderIndex
            ) {
                deskIndexToPerPlanetBonus[xxchaAllianceIndex] = 1;
            }
        }
        return deskIndexToPerPlanetBonus;
    }

    static _isRepresentativeGovernmentActive() {
        const nsidSet = new Set([
            "card.agenda:pok/representative_government",
            "card.agenda:base.only/representative_government",
        ]);
        const checkIsDiscardPile = true;
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsidSet.has(nsid)) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile)) {
                continue;
            }
            if (world.TI4.agenda.getAgendaNsid() === nsid) {
                continue; // currently being voted on
            }
            return true;
        }
        return false;
    }

    static getDeskIndexToAvailableVotes() {
        const deskIndexToAvailableVotes = {};
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            deskIndexToAvailableVotes[playerDesk.index] = 0;
        }

        // Representative government.
        if (Agenda._isRepresentativeGovernmentActive()) {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                deskIndexToAvailableVotes[playerDesk.index] = 1;
            }
            return deskIndexToAvailableVotes;
        }

        const deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();

        const gromOmegaNsid =
            "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
        const gromOmegaDeskIndexSet = new Set();
        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === gromOmegaNsid) {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                gromOmegaDeskIndexSet.add(closestDesk.index);
            }
        }

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const planet = world.TI4.getPlanetByCard(obj);
            if (!planet) {
                continue;
            }

            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (!closestDesk) {
                continue;
            }

            const deskIndex = closestDesk.index;
            const oldValue = deskIndexToAvailableVotes[deskIndex] || 0;
            let newValue = oldValue + planet.raw.influence;

            const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
            newValue += bonus;

            if (gromOmegaDeskIndexSet.has(deskIndex)) {
                newValue += planet.raw.resources;
            }

            deskIndexToAvailableVotes[deskIndex] = newValue;
        }

        // Homebrew?
        for (const voteCountModifier of _injectedVoteCountModifiers) {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                let delta = 0;
                // Prevent a buggy modifier from stopping the other items.
                try {
                    delta = voteCountModifier(playerDesk);
                    assert(typeof delta === "number");
                } catch (exception) {
                    console.log(
                        `Agenda.getDeskIndexToAvailableVotes error: ${exception.stack}`
                    );
                }
                deskIndexToAvailableVotes[playerDesk.index] += delta;
            }
        }

        return deskIndexToAvailableVotes;
    }

    static resetPlanetCards() {
        const systemHexes = new Set();
        for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
            const pos = systemTileObj.getPosition();
            const hex = Hex.fromPosition(pos);
            systemHexes.add(hex);
        }

        const checkIsDiscardPile = false;
        const allowFaceDown = true;
        for (const obj of world.getAllObjects()) {
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue; // not a loose card
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (
                !nsid.startsWith("card.planet") &&
                !nsid.startsWith("card.legendary_planet")
            ) {
                continue; // not a planet card
            }
            if (obj.isFaceUp()) {
                continue; // already face up
            }
            const pos = obj.getPosition();
            const hex = Hex.fromPosition(pos);
            if (systemHexes.has(hex)) {
                continue; // on a aystem tile
            }

            const rotation = obj.getRotation();
            const newRotation = new Rotator(rotation.pitch, rotation.yaw, -180);
            obj.setPosition(pos.add([0, 0, 3]));
            obj.setRotation(newRotation, 1);
        }
    }

    // ----------------------------------------------------------------------

    constructor() {
        this._epoch = 0; // advance every agenda change
        this._agendaStateMachine = undefined;

        this._agendaCard = undefined;
        this._deskIndexToAvailableVotes = undefined;
        this._outcomeNames = undefined;

        this._noWhensDeskIndexSet = undefined;
        this._noAftersDeskIndexSet = undefined;
        this._whensAftersLockedDeskSet = undefined;
        this._voteLockedDeskIndexSet = undefined;
        this._deskIndexToOutcomeIndex = undefined;
        this._deskIndexToVoteCount = undefined;
        this._deskIndexToPredictedOutcomeIndexToPredictionCount = undefined;

        this._invalidatePending = false;

        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            assert(!agendaCard || agendaCard instanceof Card);

            world.TI4.turns.clearAllPassed();

            this._epoch += 1;
            this._agendaCard = agendaCard;
            if (agendaCard) {
                this.clear();
                this.init();

                if (Agenda._isRepresentativeGovernmentActive()) {
                    Broadcast.chatAll(
                        locale("ui.agenda.representative_government")
                    );
                }
            } else {
                this.clear();
            }
        });
    }

    // ----------------------------------------------------------------------

    /**
     * Is an agenda in progress?
     *
     * @returns {boolean}
     */
    isActive() {
        return this._agendaStateMachine ? true : false;
    }

    /**
     * Agenda sequence number.
     *
     * @returns {number}
     */
    getEpoch() {
        return this._epoch;
    }

    /**
     * Agenda state (when, after, vote, etc).
     *
     * @returns {AgendaStateMachine|undefined}
     */
    getStateMachine() {
        return this._agendaStateMachine;
    }

    /**
     * Get available votes for desk.
     *
     * @param {number} deskIndex
     * @returns {number|undefined}
     */
    getAvailableVotes(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        return (
            this._deskIndexToAvailableVotes &&
            this._deskIndexToAvailableVotes[deskIndex]
        );
    }

    /**
     * How many outcomes exist?
     *
     * @returns {number|undefined}
     */
    getNumOutcomes() {
        return this._outcomeNames ? this._outcomeNames.length : 0;
    }

    /**
     * Get one outcome name.
     *
     * @param {number} outcomeIndex
     * @returns {string}
     */
    getOutcomeName(outcomeIndex) {
        assert(typeof outcomeIndex === "number");
        assert(this._outcomeNames);
        assert(outcomeIndex >= 0 && outcomeIndex < this._outcomeNames.length);
        return this._outcomeNames[outcomeIndex];
    }

    /**
     * The agenda card currently in the active agenda spot.
     *
     * @returns {Card}
     */
    getAgendaCard() {
        return this._agendaCard;
    }

    /**
     * The agenda NSID currently in the active agenda spot.
     */
    getAgendaNsid() {
        return this._agendaCard && ObjectNamespace.getNsid(this._agendaCard);
    }

    // ----------------------------------------------------------------------

    /**
     * Cancel any active agenda, this `isActive` will fail until `init`.
     *
     * @returns {Agenda} self, for chaining
     */
    clear() {
        this._agendaStateMachine = undefined;

        this._outcomeNames = undefined;
        this._deskIndexToAvailableVotes = undefined;

        this._noWhensDeskIndexSet = undefined;
        this._noAftersDeskIndexSet = undefined;
        this._whensAftersLockedDeskSet = undefined;
        this._voteLockedDeskIndexSet = undefined;
        this._deskIndexToOutcomeIndex = undefined;
        this._deskIndexToVoteCount = undefined;
        this._deskIndexToPredictedOutcomeIndexToPredictionCount = undefined;

        this._postInvalidate();
        return this;
    }

    init() {
        this._agendaStateMachine = new AgendaStateMachine();
        assert.equal(this._agendaStateMachine.name, "WAITING_FOR_START");

        this._deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();

        this._noWhensDeskIndexSet = new Set();
        this._noAftersDeskIndexSet = new Set();
        this._whensAftersLockedDeskSet = new Set();
        this._voteLockedDeskIndexSet = new Set();
        this._deskIndexToOutcomeIndex = {};
        this._deskIndexToVoteCount = {};
        this._deskIndexToPredictedOutcomeIndexToPredictionCount = {};

        this._postInvalidate();
        return this;
    }

    /**
     * Start a new agenda.  Must call init first!
     *
     * @returns {Agenda} self, or chaining
     */
    start() {
        assert(this._agendaStateMachine);
        assert.equal(this._agendaStateMachine.name, "WAITING_FOR_START");

        this._agendaStateMachine.next();
        this.resetForCurrentState();

        this._postInvalidate();
        return this;
    }

    /**
     * Set default outcome names.
     *
     * @param {string} outcomeType
     * @returns {Agenda} self, for chaining
     */
    resetOutcomeNames(outcomeType) {
        assert(typeof outcomeType === "string");
        assert(AgendaOutcome.isOutcomeType(outcomeType));

        assert(this._agendaStateMachine);
        assert.equal(this._agendaStateMachine.name, "OUTCOME_TYPE");

        const outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);
        assert(Array.isArray(outcomeNames));
        assert(outcomeNames.length > 0);

        this._outcomeNames = outcomeNames;
        this._agendaStateMachine.next();
        this.resetForCurrentState(); // entering "WHENs", sets turn order

        this._postInvalidate();
        return this;
    }

    /**
     * Edit an outcome name.
     *
     * @param {number} outcomeIndex
     * @param {string} value
     *
     * @returns {Agenda} self, for chaining
     */
    setOutcomeName(outcomeIndex, value) {
        assert(typeof outcomeIndex === "number");
        assert(typeof value === "string");
        assert(this._outcomeNames);
        assert(outcomeIndex >= 0 && outcomeIndex < this._outcomeNames.length);

        this._outcomeNames[outcomeIndex] = value;

        this._postInvalidate();
        return this;
    }

    // ----------------------------------------------------------------------

    _playForPhase(deskIndex, stateName, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof stateName === "string");
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        assert(stateName === "WHEN" || stateName === "AFTER");

        if (!this._agendaStateMachine) {
            return; // "can't happen" paranoia
        }
        if (this._agendaStateMachine.name !== stateName) {
            return; // not in this phase (early play -- breaks rules but players can do it)
        }

        const current = world.TI4.turns.getCurrentTurn();
        const currentIndex = current ? current.index : -1;
        if (currentIndex !== deskIndex) {
            return; // not this player's turn (early play -- breaks rules but players can do it)
        }

        // It is the correct phase and this player's turn.  End turn.
        world.TI4.turns.endTurn(clickingPlayer);
    }

    _passForPhase(deskIndex, stateName, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof stateName === "string");
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        assert(
            stateName === "WHEN" ||
                stateName === "AFTER" ||
                stateName === "VOTE"
        );

        if (!this._agendaStateMachine) {
            return; // "can't happen" paranoia
        }
        if (this._agendaStateMachine.name !== stateName) {
            return; // not in this phase (early pass)
        }

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);

        // It is the correct phase, mark passed and advance turn.
        world.TI4.turns.setPassed(playerDesk.playerSlot, true);
        if (world.TI4.turns.getCurrentTurn() !== playerDesk) {
            return; // Not our turn (early pass)
        }

        // At this point it is correct phase and our turn.
        if (!world.TI4.turns.isTurnOrderEmpty()) {
            world.TI4.turns.endTurn(clickingPlayer);
            return; // Advance to next player, same phase
        }

        // Everyone passed.  Advance phases and reset UI to process it.
        this._agendaStateMachine.next();
        this._updatePassedAndSetTurnForPhase(clickingPlayer);
    }

    _updatePassedAndSetTurnForPhase(clickingPlayer) {
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        world.TI4.turns.clearAllPassed();

        if (!this._agendaStateMachine) {
            return; // "can't happen" paranoia
        }

        // Players can click "no whens", etc, early.  Mark them as passed when
        // changing to a new state.
        let passedDeskIndexSet = undefined;
        let order = undefined;
        if (this._agendaStateMachine.name === "WHEN") {
            passedDeskIndexSet = this._noWhensDeskIndexSet;
            order = AgendaTurnOrder.getResolveOrder();
        } else if (this._agendaStateMachine.name === "AFTER") {
            passedDeskIndexSet = this._noAftersDeskIndexSet;
            order = AgendaTurnOrder.getResolveOrder();
        } else if (this._agendaStateMachine.name === "VOTE") {
            passedDeskIndexSet = this._voteLockedDeskIndexSet;
            order = AgendaTurnOrder.getVoteOrder();
        }
        if (!passedDeskIndexSet) {
            return; // not in a state where this matters
        }

        // Apply passed.
        const desks = world.TI4.getAllPlayerDesks();
        for (const deskIndex of passedDeskIndexSet) {
            const playerSlot = desks[deskIndex].playerSlot;
            world.TI4.turns.setPassed(playerSlot, true);
        }

        // If all players have passed, advance state.
        if (world.TI4.turns.isTurnOrderEmpty()) {
            this._agendaStateMachine.next();
            this._updatePassedAndSetTurnForPhase(clickingPlayer);
            return;
        }

        // Set turn to first unpassed player.
        world.TI4.turns.setTurnOrder(order);
        for (const desk of order) {
            if (passedDeskIndexSet.has(desk.index)) {
                continue;
            }
            world.TI4.turns.setCurrentTurn(desk, clickingPlayer);
            return;
        }

        // If we get here we could not find a non-passed player.
        throw new Error(
            "Agenda._updatePassedAndSetTurnForPhase: no active player"
        );
    }

    _getErrorExtra() {
        const stateName = this._agendaStateMachine
            ? this._agendaStateMachine.name
            : "<nil>";
        return `state "${stateName}"`;
    }

    resetForCurrentState(clickingPlayer) {
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        this._updatePassedAndSetTurnForPhase(clickingPlayer);
        return this;
    }

    getNoWhens(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        return (
            this._noWhensDeskIndexSet &&
            this._noWhensDeskIndexSet.has(deskIndex)
        );
    }

    setNoWhens(deskIndex, value, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof value === "boolean");
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        if (value) {
            this._noWhensDeskIndexSet.add(deskIndex);
            this._passForPhase(deskIndex, "WHEN", clickingPlayer);
        } else {
            this._noWhensDeskIndexSet.delete(deskIndex);
        }

        this._postInvalidate();
        return this;
    }

    resetNoWhens() {
        for (const deskIndex of [...this._noWhensDeskIndexSet]) {
            if (!this._whensAftersLockedDeskSet.has(deskIndex)) {
                this._noWhensDeskIndexSet.delete(deskIndex);
            }
        }

        if (
            this._agendaStateMachine &&
            this._agendaStateMachine.name === "WHEN"
        ) {
            world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
                if (this._noWhensDeskIndexSet.has(playerDesk.index)) {
                    return;
                }
                world.TI4.turns.setPassed(playerDesk.playerSlot, false);
            });
        }

        this._postInvalidate();
        return this;
    }

    playWhen(deskIndex, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        this._playForPhase(deskIndex, "WHEN", clickingPlayer);

        this._postInvalidate();
        return this;
    }

    getNoAfters(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        return (
            this._noAftersDeskIndexSet &&
            this._noAftersDeskIndexSet.has(deskIndex)
        );
    }

    setNoAfters(deskIndex, value, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof value === "boolean");
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        if (value) {
            this._noAftersDeskIndexSet.add(deskIndex);
            this._passForPhase(deskIndex, "AFTER", clickingPlayer);
        } else {
            this._noAftersDeskIndexSet.delete(deskIndex);
        }

        this._postInvalidate();
        return this;
    }

    resetNoAfters() {
        for (const deskIndex of [...this._noAftersDeskIndexSet]) {
            if (!this._whensAftersLockedDeskSet.has(deskIndex)) {
                this._noAftersDeskIndexSet.delete(deskIndex);
            }
        }

        if (
            this._agendaStateMachine &&
            this._agendaStateMachine.name === "AFTER"
        ) {
            world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
                if (this._noAftersDeskIndexSet.has(playerDesk.index)) {
                    return;
                }
                world.TI4.turns.setPassed(playerDesk.playerSlot, false);
            });
        }

        this._postInvalidate();
        return this;
    }

    playAfter(deskIndex, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(!clickingPlayer || clickingPlayer instanceof Player);

        this._playForPhase(deskIndex, "AFTER", clickingPlayer);

        this._postInvalidate();
        return this;
    }

    getWhensAftersLocked(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        return (
            this._whensAftersLockedDeskSet &&
            this._whensAftersLockedDeskSet.has(deskIndex)
        );
    }

    setWhensAftersLocked(deskIndex, value, clickingPlayer) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof value === "boolean");
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        assert(this._whensAftersLockedDeskSet);

        if (value) {
            this._whensAftersLockedDeskSet.add(deskIndex);
        } else {
            this._whensAftersLockedDeskSet.delete(deskIndex);
        }
        this._postInvalidate();
        return this;
    }

    getVoteLocked(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        return (
            this._voteLockedDeskIndexSet &&
            this._voteLockedDeskIndexSet.has(deskIndex)
        );
    }

    setVoteLocked(deskIndex, value, clickingPlayer) {
        world.TI4.errorReporting.setExtra(this._getErrorExtra());
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof value === "boolean");
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        assert(this._voteLockedDeskIndexSet);
        world.TI4.errorReporting.clearExtra();

        if (value) {
            this._voteLockedDeskIndexSet.add(deskIndex);
            this._passForPhase(deskIndex, "VOTE", clickingPlayer);
        } else {
            this._voteLockedDeskIndexSet.delete(deskIndex);

            // Clear passed
            if (
                this._agendaStateMachine &&
                this._agendaStateMachine.name === "VOTE"
            ) {
                const desks = world.TI4.getAllPlayerDesks();
                const playerSlot = desks[deskIndex].playerSlot;
                world.TI4.turns.setPassed(playerSlot, false);
            }
        }

        this._postInvalidate();
        return this;
    }

    getVoteOutcomeIndex(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        const outcomeIndex = this._deskIndexToOutcomeIndex[deskIndex];
        if (outcomeIndex === undefined) {
            return -1;
        }
        return outcomeIndex;
    }

    setVoteOutcomeIndex(deskIndex, outcomeIndex, clickingPlayer) {
        world.TI4.errorReporting.setExtra(this._getErrorExtra());
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof outcomeIndex === "number");
        assert(outcomeIndex >= 0 && outcomeIndex < this._outcomeNames.length);
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        world.TI4.errorReporting.clearExtra();

        this._deskIndexToOutcomeIndex[deskIndex] = outcomeIndex;

        this._postInvalidate();
        return this;
    }

    getVoteCount(deskIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        if (!this._deskIndexToVoteCount) {
            return 0;
        }
        const voteCount = this._deskIndexToVoteCount[deskIndex];
        if (!voteCount) {
            return 0;
        }
        return voteCount;
    }

    setVoteCount(deskIndex, value, clickingPlayer) {
        world.TI4.errorReporting.setExtra(this._getErrorExtra());
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof value === "number");
        assert(value >= 0);
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        world.TI4.errorReporting.clearExtra();

        this._deskIndexToVoteCount[deskIndex] = value;

        this._postInvalidate();
        return this;
    }

    getPredictionCount(deskIndex, outcomeIndex) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof outcomeIndex === "number");
        assert(outcomeIndex >= 0 && outcomeIndex < this._outcomeNames.length);

        const outcomeIndexToPredictionCount =
            this._deskIndexToPredictedOutcomeIndexToPredictionCount[deskIndex];
        if (!outcomeIndexToPredictionCount) {
            return 0;
        }
        const predictionCount = outcomeIndexToPredictionCount[outcomeIndex];
        if (predictionCount === undefined) {
            return 0;
        }
        return predictionCount;
    }

    setPredictionCount(
        deskIndex,
        outcomeIndex,
        predictionCount,
        clickingPlayer
    ) {
        world.TI4.errorReporting.setExtra(this._getErrorExtra());
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < world.TI4.config.playerCount);
        assert(typeof outcomeIndex === "number");
        assert(outcomeIndex >= 0 && outcomeIndex < this._outcomeNames.length);
        assert(typeof predictionCount === "number");
        assert(predictionCount >= 0);
        assert(!clickingPlayer || clickingPlayer instanceof Player);
        world.TI4.errorReporting.clearExtra();

        let outcomeIndexToPredictionCount =
            this._deskIndexToPredictedOutcomeIndexToPredictionCount[deskIndex];
        if (!outcomeIndexToPredictionCount) {
            outcomeIndexToPredictionCount = {};
            this._deskIndexToPredictedOutcomeIndexToPredictionCount[deskIndex] =
                outcomeIndexToPredictionCount;
        }
        outcomeIndexToPredictionCount[outcomeIndex] = predictionCount;

        this._postInvalidate();
        return this;
    }

    summarizeVotes() {
        const result = [];
        for (
            let outcomeIndex = 0;
            outcomeIndex < this.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcomeName = this.getOutcomeName(outcomeIndex);
            let voteTotal = 0;
            let voters = [];
            for (
                let deskIndex = 0;
                deskIndex < world.TI4.config.playerCount;
                deskIndex++
            ) {
                const deskVoteOutcomeIndex =
                    this.getVoteOutcomeIndex(deskIndex);
                if (deskVoteOutcomeIndex !== outcomeIndex) {
                    continue; // voted for something else
                }
                const votes = this.getVoteCount(deskIndex);
                if (votes <= 0) {
                    continue; // ignore zero votes
                }
                voteTotal += votes;
                voters.push(deskIndex);
            }
            const desks = world.TI4.getAllPlayerDesks();
            voters = voters.map((deskIndex) => {
                const desk = desks[deskIndex];
                return desk.colorName;
            });
            voters = voters.length > 0 ? ` (${voters.join(", ")})` : "";
            result.push(`“${outcomeName}”: ${voteTotal}${voters}`);
        }
        return result.join(", ");
    }

    summarizePredictions() {
        const desks = world.TI4.getAllPlayerDesks();
        const result = [];
        for (
            let outcomeIndex = 0;
            outcomeIndex < this.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcomeName = this.getOutcomeName(outcomeIndex);
            const predictions = [];
            for (
                let deskIndex = 0;
                deskIndex < world.TI4.config.playerCount;
                deskIndex++
            ) {
                const desk = desks[deskIndex];
                const count = this.getPredictionCount(deskIndex, outcomeIndex);
                for (let i = 0; i < count; i++) {
                    predictions.push(desk.colorName);
                }
            }
            if (predictions.length > 0) {
                result.push(`“${outcomeName}”: ${predictions.join(", ")}`);
            }
        }
        if (result.length === 0) {
            return locale("ui.message.none");
        }
        return result.join(", ");
    }

    // ----------------------------------------------------------------------

    /**
     * Tell any listeners that something changed.  Batch up all invalidate
     * calls this frame, update next frame.
     *
     * @returns {undefined}
     */
    _postInvalidate() {
        if (this._invalidatePending) {
            return;
        }
        if (world.__isMock) {
            // Mock world: call event immediately b/c test might not have a next frame
            globalEvents.TI4.onAgendaPlayerStateChanged.trigger();
            return;
        }
        this._invalidatePending = true;
        process.nextTick(() => {
            this._invalidatePending = false;
            globalEvents.TI4.onAgendaPlayerStateChanged.trigger();
        });
    }

    // This does not work reliably.
    _onPlanetCardFlipped(card, isFaceUp) {
        assert(card instanceof Card);
        assert(typeof isFaceUp === "boolean");

        if (!this.isActive() || this.getStateMachine().name !== "VOTE") {
            return;
        }

        const pos = card.getPosition();
        const closestDesk = world.TI4.getClosestPlayerDesk(pos);
        const deskIndex = closestDesk.index;

        const planet = world.TI4.getPlanetByCard(card);
        assert(planet);
        let influence = planet.raw.influence;

        // If xxcha hero add resources to influence value.
        const playerSlot = closestDesk.playerSlot;
        const gromOmegaNsid =
            "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
        if (CardUtil.hasCard(playerSlot, gromOmegaNsid, false)) {
            influence += planet.raw.resources;
        }

        // Apply bonus votes.
        const deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
        const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
        influence += bonus;
        const deltaValue = influence * (isFaceUp ? -1 : 1);

        console.log(
            `Agenda._onPlanetCardFlipped: ${deltaValue} for ${closestDesk.colorName}`
        );

        let votes = this.getVoteCount(deskIndex);
        votes = Math.max(0, votes + deltaValue);

        if (this.getVoteLocked(deskIndex)) {
            console.log("Agenda._onPlanetCardFlipped: vote locked");
            return;
        }

        const clickingPlayer = undefined;
        this.setVoteCount(deskIndex, votes, clickingPlayer);
    }
}

module.exports = { Agenda };
