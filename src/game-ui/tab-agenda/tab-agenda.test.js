require("../../global"); // create world.TI4
const assert = require("assert");
const { TabAgenda } = require("./tab-agenda");
const { AgendaOutcome, OUTCOME_TYPE } = require("./agenda-outcome");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../wrapper/api");

it("constructor", () => {
    new TabAgenda();
});

it("getDeskIndexToPerPlanetBonus", () => {
    let deskIndexToPerPlanetBonus = TabAgenda.getDeskIndexToPerPlanetBonus();
    assert.equal(
        Object.keys(deskIndexToPerPlanetBonus).length,
        world.TI4.config.playerCount
    );
    assert.deepEqual(deskIndexToPerPlanetBonus, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    const desks = world.TI4.getAllPlayerDesks();
    const xxchaCommanderFaceDown = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.leader.commander.xxcha:pok/elder_qanoj",
            }),
        ],
        faceUp: false,
        position: desks[1].center,
    });
    const xxchaCommanderFaceUp = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.leader.commander.xxcha:pok/elder_qanoj",
            }),
        ],
        faceUp: true,
        position: desks[1].center,
    });
    const xxchaAllianceFaceDown = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.alliance:pok/xxcha",
            }),
        ],
        faceUp: false,
        position: desks[2].center,
    });
    const xxchaAllianceFaceUp = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.alliance:pok/xxcha",
            }),
        ],
        faceUp: true,
        position: desks[2].center,
    });

    world.__clear();
    world.__addObject(xxchaCommanderFaceDown);
    world.__addObject(xxchaAllianceFaceDown);
    deskIndexToPerPlanetBonus = TabAgenda.getDeskIndexToPerPlanetBonus();
    world.__clear();
    assert.deepEqual(deskIndexToPerPlanetBonus, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(xxchaCommanderFaceUp);
    world.__addObject(xxchaAllianceFaceDown);
    deskIndexToPerPlanetBonus = TabAgenda.getDeskIndexToPerPlanetBonus();
    world.__clear();
    assert.deepEqual(deskIndexToPerPlanetBonus, {
        0: 0,
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(xxchaCommanderFaceDown);
    world.__addObject(xxchaAllianceFaceUp);
    deskIndexToPerPlanetBonus = TabAgenda.getDeskIndexToPerPlanetBonus();
    world.__clear();
    assert.deepEqual(deskIndexToPerPlanetBonus, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(xxchaCommanderFaceUp);
    world.__addObject(xxchaAllianceFaceUp);
    deskIndexToPerPlanetBonus = TabAgenda.getDeskIndexToPerPlanetBonus();
    world.__clear();
    assert.deepEqual(deskIndexToPerPlanetBonus, {
        0: 0,
        1: 1,
        2: 1,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
});

it("getDeskIndexToAvailableVotes", () => {
    let deskIndexToAvailableVotes = TabAgenda.getDeskIndexToAvailableVotes();
    assert.equal(
        Object.keys(deskIndexToAvailableVotes).length,
        world.TI4.config.playerCount
    );
    assert.deepEqual(deskIndexToAvailableVotes, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    const desks = world.TI4.getAllPlayerDesks();
    const mecatolFaceDown = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/mecatol_rex",
            }),
        ],
        faceUp: false,
        position: desks[1].center,
    });
    const mecatolFaceUp = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.planet:base/mecatol_rex",
            }),
        ],
        faceUp: true,
        position: desks[1].center,
    });
    const xxchaHeroOmegaFaceDown = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata:
                    "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega",
            }),
        ],
        faceUp: false,
        position: desks[1].center,
    });
    const xxchaHeroOmegaFaceUp = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata:
                    "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega",
            }),
        ],
        faceUp: true,
        position: desks[1].center,
    });

    world.__clear();
    world.__addObject(mecatolFaceDown);
    world.__addObject(xxchaHeroOmegaFaceDown);
    deskIndexToAvailableVotes = TabAgenda.getDeskIndexToAvailableVotes();
    world.__clear();
    assert.deepEqual(deskIndexToAvailableVotes, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(mecatolFaceUp);
    world.__addObject(xxchaHeroOmegaFaceDown);
    deskIndexToAvailableVotes = TabAgenda.getDeskIndexToAvailableVotes();
    world.__clear();
    assert.deepEqual(deskIndexToAvailableVotes, {
        0: 0,
        1: 6,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(mecatolFaceDown);
    world.__addObject(xxchaHeroOmegaFaceUp);
    deskIndexToAvailableVotes = TabAgenda.getDeskIndexToAvailableVotes();
    world.__clear();
    assert.deepEqual(deskIndexToAvailableVotes, {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });

    world.__clear();
    world.__addObject(mecatolFaceUp);
    world.__addObject(xxchaHeroOmegaFaceUp);
    deskIndexToAvailableVotes = TabAgenda.getDeskIndexToAvailableVotes();
    world.__clear();
    assert.deepEqual(deskIndexToAvailableVotes, {
        0: 0,
        1: 7,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    });
});

it("onAgendaChanged creates state machine", () => {
    const tabAgenda = new TabAgenda();
    assert(!tabAgenda._stateMachine);

    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    card = undefined;
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(!tabAgenda._stateMachine);
});

it("updatePassedAndSetTurnForPhase", () => {
    const tabAgenda = new TabAgenda();
    assert(!tabAgenda._deskUIs);

    // Cannot update without WHEN/AFTER/VOTE phases.
    let success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });

    world.__clear();
    world.__addObject(speakerToken);

    // Start agenda phase.
    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    // Set outcomes.
    const outcomeType = OUTCOME_TYPE.FOR_AGAINST;
    tabAgenda._outcomeType = outcomeType;
    tabAgenda._outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);

    // Advance to WHEN.
    tabAgenda._stateMachine.setState("WHEN");
    tabAgenda.resetForCurrentState();
    assert(tabAgenda._deskUIs);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Desk 0 is speaker, no one has passed.
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current, desks[0]);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Pass 0.
    tabAgenda._deskUIs[0]._noWhens = true;
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current, desks[1]);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // All pass, advance fails.
    for (const deskUi of tabAgenda._deskUIs) {
        deskUi._noWhens = true;
    }
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    // Previous current state still applies.
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current, desks[1]);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    world.__clear();
});

it("whens, afters, votes in order", () => {
    const tabAgenda = new TabAgenda();
    const clickingPlayer = new MockPlayer();

    // Cannot update without WHEN/AFTER/VOTE phases.
    let success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    const statusPads = desks.map((desk) => {
        const mockStatusPad = new MockGameObject({
            templateMetadata: "pad:base/status",
            owningPlayerSlot: desk.playerSlot,
        });
        mockStatusPad.__getPass = () => {
            return mockStatusPad.__pass;
        };
        mockStatusPad.__setPass = (value) => {
            mockStatusPad.__pass = value;
        };
        return mockStatusPad;
    });

    world.__clear();
    world.__addObject(speakerToken);
    statusPads.forEach((statusPad) => {
        world.__addObject(statusPad);
    });

    // Start agenda phase.
    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    // Set outcomes.
    const outcomeType = OUTCOME_TYPE.FOR_AGAINST;
    tabAgenda._outcomeType = outcomeType;
    tabAgenda._outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);

    // Advance to WHEN.
    tabAgenda._stateMachine.setState("WHEN");
    tabAgenda.resetForCurrentState();
    assert(tabAgenda._deskUIs);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Desk 0 is speaker, no one has passed.
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // 0 and 1 click no whens.  Do 1 first to verify skip.
    // Since we are in the relevant phase this method sets pass.
    tabAgenda._passForPhase(desks[1], clickingPlayer, "WHEN.MAIN");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    tabAgenda._passForPhase(desks[0], clickingPlayer, "WHEN.MAIN");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 2);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Remaining players click no whens, advance to AFTER.
    tabAgenda._passForPhase(desks[2], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "WHEN.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "WHEN.MAIN");

    // Starting the AFTER phase.
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(tabAgenda._stateMachine.main, "AFTER.MAIN");

    tabAgenda._passForPhase(desks[0], clickingPlayer, "AFTER.MAIN");
    tabAgenda._passForPhase(desks[1], clickingPlayer, "AFTER.MAIN");
    tabAgenda._passForPhase(desks[2], clickingPlayer, "AFTER.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "AFTER.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "AFTER.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "AFTER.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "AFTER.MAIN");

    // Starting the VOTE phase.
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1); // start to the right of the speaker!
    assert.equal(tabAgenda._stateMachine.main, "VOTE.MAIN");

    tabAgenda._passForPhase(desks[0], clickingPlayer, "VOTE.MAIN");
    tabAgenda._passForPhase(desks[1], clickingPlayer, "VOTE.MAIN");
    tabAgenda._passForPhase(desks[2], clickingPlayer, "VOTE.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "VOTE.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "VOTE.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "VOTE.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "VOTE.MAIN");

    // Finished the VOTE phase.
    assert(!tabAgenda._stateMachine);
    assert(!tabAgenda._deskUIs);
});

it("early no afters during whens phase", () => {
    const tabAgenda = new TabAgenda();
    const clickingPlayer = new MockPlayer();

    // Cannot update without WHEN/AFTER/VOTE phases.
    let success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    const statusPads = desks.map((desk) => {
        const mockStatusPad = new MockGameObject({
            templateMetadata: "pad:base/status",
            owningPlayerSlot: desk.playerSlot,
        });
        mockStatusPad.__getPass = () => {
            return mockStatusPad.__pass;
        };
        mockStatusPad.__setPass = (value) => {
            mockStatusPad.__pass = value;
        };
        return mockStatusPad;
    });

    world.__clear();
    world.__addObject(speakerToken);
    statusPads.forEach((statusPad) => {
        world.__addObject(statusPad);
    });

    // Start agenda phase.
    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    // Set outcomes.
    const outcomeType = OUTCOME_TYPE.FOR_AGAINST;
    tabAgenda._outcomeType = outcomeType;
    tabAgenda._outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);

    // Advance to WHEN.
    tabAgenda._stateMachine.setState("WHEN");
    tabAgenda.resetForCurrentState();
    assert(tabAgenda._deskUIs);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Desk 0 is speaker, no one has passed.
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Early no afters.
    // We are NOT in the relevant phase, so set the per-desk flag.
    tabAgenda._deskUIs[0]._noAfters = true;
    tabAgenda._deskUIs[1]._noAfters = true;
    tabAgenda._deskUIs[2]._noAfters = true;
    tabAgenda._deskUIs[3]._noAfters = true;
    tabAgenda._deskUIs[4]._noAfters = true;
    tabAgenda._deskUIs[5]._noAfters = true;

    // Now do no whens.
    tabAgenda._passForPhase(desks[0], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[1], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[2], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "WHEN.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "WHEN.MAIN");

    // SKIP THE AFTER PHASE!
    assert.equal(tabAgenda._stateMachine.main, "VOTE.MAIN");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);
});

it("partial early no afters during whens phase", () => {
    const tabAgenda = new TabAgenda();
    const clickingPlayer = new MockPlayer();

    // Cannot update without WHEN/AFTER/VOTE phases.
    let success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    const statusPads = desks.map((desk) => {
        const mockStatusPad = new MockGameObject({
            templateMetadata: "pad:base/status",
            owningPlayerSlot: desk.playerSlot,
        });
        mockStatusPad.__getPass = () => {
            return mockStatusPad.__pass;
        };
        mockStatusPad.__setPass = (value) => {
            mockStatusPad.__pass = value;
        };
        return mockStatusPad;
    });

    world.__clear();
    world.__addObject(speakerToken);
    statusPads.forEach((statusPad) => {
        world.__addObject(statusPad);
    });

    // Start agenda phase.
    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    // Set outcomes.
    const outcomeType = OUTCOME_TYPE.FOR_AGAINST;
    tabAgenda._outcomeType = outcomeType;
    tabAgenda._outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);

    // Advance to WHEN.
    tabAgenda._stateMachine.setState("WHEN");
    tabAgenda.resetForCurrentState();
    assert(tabAgenda._deskUIs);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Desk 0 is speaker, no one has passed.
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Early no afters.
    // We are NOT in the relevant phase, so set the per-desk flag.
    tabAgenda._deskUIs[0]._noAfters = true;
    tabAgenda._deskUIs[1]._noAfters = true;
    tabAgenda._deskUIs[2]._noAfters = true;
    tabAgenda._deskUIs[3]._noAfters = true;
    //tabAgenda._deskUIs[4]._noAfters = true;
    tabAgenda._deskUIs[5]._noAfters = true;

    // Now do no whens.
    tabAgenda._passForPhase(desks[0], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[1], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[2], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "WHEN.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "WHEN.MAIN");

    // Only the one after remains.
    assert.equal(tabAgenda._stateMachine.main, "AFTER.MAIN");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 4);
});

it("early no afters AND vote lock during whens phase", () => {
    const tabAgenda = new TabAgenda();
    const clickingPlayer = new MockPlayer();

    // Cannot update without WHEN/AFTER/VOTE phases.
    let success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(!success);

    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    const statusPads = desks.map((desk) => {
        const mockStatusPad = new MockGameObject({
            templateMetadata: "pad:base/status",
            owningPlayerSlot: desk.playerSlot,
        });
        mockStatusPad.__getPass = () => {
            return mockStatusPad.__pass;
        };
        mockStatusPad.__setPass = (value) => {
            mockStatusPad.__pass = value;
        };
        return mockStatusPad;
    });

    world.__clear();
    world.__addObject(speakerToken);
    statusPads.forEach((statusPad) => {
        world.__addObject(statusPad);
    });

    // Start agenda phase.
    let card = new MockCard();
    globalEvents.TI4.onAgendaChanged.trigger(card);
    assert(tabAgenda._stateMachine);

    // Set outcomes.
    const outcomeType = OUTCOME_TYPE.FOR_AGAINST;
    tabAgenda._outcomeType = outcomeType;
    tabAgenda._outcomeNames = AgendaOutcome.getDefaultOutcomeNames(outcomeType);

    // Advance to WHEN.
    tabAgenda._stateMachine.setState("WHEN");
    tabAgenda.resetForCurrentState();
    assert(tabAgenda._deskUIs);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Desk 0 is speaker, no one has passed.
    success = tabAgenda.updatePassedAndSetTurnForPhase();
    assert(success);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN");

    // Early no afters.
    // We are NOT in the relevant phase, so set the per-desk flag.
    tabAgenda._deskUIs[0]._noAfters = true;
    tabAgenda._deskUIs[1]._noAfters = true;
    tabAgenda._deskUIs[2]._noAfters = true;
    tabAgenda._deskUIs[3]._noAfters = true;
    tabAgenda._deskUIs[4]._noAfters = true;
    tabAgenda._deskUIs[5]._noAfters = true;
    tabAgenda._deskUIs[0]._voteLocked = true;
    tabAgenda._deskUIs[1]._voteLocked = true;
    tabAgenda._deskUIs[2]._voteLocked = true;
    tabAgenda._deskUIs[3]._voteLocked = true;
    tabAgenda._deskUIs[4]._voteLocked = true;
    tabAgenda._deskUIs[5]._voteLocked = true;

    // Now do no whens.
    tabAgenda._passForPhase(desks[0], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[1], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[2], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[3], clickingPlayer, "WHEN.MAIN");
    tabAgenda._passForPhase(desks[4], clickingPlayer, "WHEN.MAIN");
    assert.equal(tabAgenda._stateMachine.main, "WHEN.MAIN"); // next should advance state
    tabAgenda._passForPhase(desks[5], clickingPlayer, "WHEN.MAIN");

    // SKIP THE AFTER AND VOTE PHASES!
    assert(!tabAgenda._stateMachine);
});
