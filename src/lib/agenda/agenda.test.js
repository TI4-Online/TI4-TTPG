require("../../global"); // create world.TI4
const assert = require("assert");
const { Agenda } = require("./agenda");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    MockPlayer,
    world,
} = require("../../wrapper/api");
const { OUTCOME_TYPE } = require("./agenda-outcome");

it("static getDeskIndexToPerPlanetBonus", () => {
    let deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
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
    deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
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
    deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
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
    deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
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
    deskIndexToPerPlanetBonus = Agenda.getDeskIndexToPerPlanetBonus();
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

it("static getDeskIndexToAvailableVotes", () => {
    let deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
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
    deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
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
    deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
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
    deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
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
    deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
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

it("constructor", () => {
    new Agenda();
});

it("init/start/clear", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda();
    assert(!agenda.getStateMachine());
    assert(!agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 0);

    agenda.init();
    assert.equal(agenda.getStateMachine().name, "WAITING_FOR_START");
    assert(agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 0);

    agenda.start();
    assert.equal(agenda.getStateMachine().name, "OUTCOME_TYPE");
    assert(agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 0);

    agenda.resetOutcomeNames("for/against");
    assert.equal(agenda.getStateMachine().name, "WHEN");
    assert(agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 2);

    agenda.clear();
    assert(!agenda.getStateMachine());
    assert(!agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 0);

    world.__clear();
});

it("edit outcome name", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda().init().start().resetOutcomeNames("for/against");
    assert.equal(agenda.getStateMachine().name, "WHEN");
    assert(agenda.isActive());
    assert.equal(agenda.getNumOutcomes(), 2);
    assert.equal(agenda.getOutcomeName(0), "For");
    assert.equal(agenda.getOutcomeName(1), "Against");

    agenda.setOutcomeName(0, "foo").setOutcomeName(1, "bar");
    assert.equal(agenda.getNumOutcomes(), 2);
    assert.equal(agenda.getOutcomeName(0), "foo");
    assert.equal(agenda.getOutcomeName(1), "bar");

    world.__clear();
});

it("noWhens basic", () => {
    const agenda = new Agenda().init().start();
    const clickingPlayer = new MockPlayer();

    assert(!agenda.getNoWhens(1));

    agenda.setNoWhens(1, false, clickingPlayer);
    assert(!agenda.getNoWhens(1));

    agenda.setNoWhens(1, true, clickingPlayer);
    assert(agenda.getNoWhens(1));

    agenda.setNoWhens(1, false, clickingPlayer);
    assert(!agenda.getNoWhens(1));
});

it("noAfters basic", () => {
    const agenda = new Agenda().init().start();
    const clickingPlayer = new MockPlayer();

    assert(!agenda.getNoAfters(1));

    agenda.setNoAfters(1, false, clickingPlayer);
    assert(!agenda.getNoAfters(1));

    agenda.setNoAfters(1, true, clickingPlayer);
    assert(agenda.getNoAfters(1));

    agenda.setNoAfters(1, false, clickingPlayer);
    assert(!agenda.getNoAfters(1));
});

it("voteLocked basic", () => {
    const agenda = new Agenda().init().start();
    const clickingPlayer = new MockPlayer();

    assert(!agenda.getVoteLocked(1));

    agenda.setVoteLocked(1, false, clickingPlayer);
    assert(!agenda.getVoteLocked(1));

    agenda.setVoteLocked(1, true, clickingPlayer);
    assert(agenda.getVoteLocked(1));

    agenda.setVoteLocked(1, false, clickingPlayer);
    assert(!agenda.getVoteLocked(1));
});

it("voteOutcomeIndex basic", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getVoteOutcomeIndex(1), -1);

    agenda.setVoteOutcomeIndex(1, 1, clickingPlayer);
    assert.equal(agenda.getVoteOutcomeIndex(1), 1);

    world.__clear();
});

it("voteCount basic", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getVoteCount(1), 0);

    agenda.setVoteCount(1, 13, clickingPlayer);
    assert.equal(agenda.getVoteCount(1), 13);

    world.__clear();
});

it("predictionCount basic", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    const deskIndex = 1;
    const outcomeIndex = 0;
    assert.equal(agenda.getPredictionCount(deskIndex, outcomeIndex), 0);

    agenda.setPredictionCount(deskIndex, outcomeIndex, 7, clickingPlayer);
    assert.equal(agenda.getPredictionCount(deskIndex, outcomeIndex), 7);

    world.__clear();
});

it("summarize votes", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    agenda.setVoteOutcomeIndex(0, 0); // for
    agenda.setVoteCount(0, 1, clickingPlayer);
    agenda.setVoteOutcomeIndex(1, 0); // for
    agenda.setVoteCount(1, 13, clickingPlayer);
    agenda.setVoteOutcomeIndex(2, 1); // against
    agenda.setVoteCount(2, 3, clickingPlayer);

    const summary = agenda.summarizeVotes();
    assert.equal(summary, "“For”: 14 (white, blue), “Against”: 3 (purple)");

    world.__clear();
});

it("whens, afters, votes in order", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // 0 and 1 click no whens.  Do 1 first to verify skip.
    // Since we are in the relevant phase this method sets pass.
    agenda.setNoWhens(1, true, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    agenda.setNoWhens(0, true, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 2);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Remaining players click no whens, advance to AFTER.
    agenda.setNoWhens(2, true, clickingPlayer);
    agenda.setNoWhens(3, true, clickingPlayer);
    agenda.setNoWhens(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");
    agenda.setNoWhens(5, true, clickingPlayer);

    // Starting the AFTER phase.
    assert.equal(agenda.getStateMachine().name, "AFTER");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);

    agenda.setNoAfters(0, true, clickingPlayer);
    agenda.setNoAfters(1, true, clickingPlayer);
    agenda.setNoAfters(2, true, clickingPlayer);
    agenda.setNoAfters(3, true, clickingPlayer);
    agenda.setNoAfters(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "AFTER");
    agenda.setNoAfters(5, true, clickingPlayer);

    // Starting the VOTE phase.
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1); // start to the right of the speaker!
    assert.equal(agenda.getStateMachine().name, "VOTE");

    agenda.setVoteLocked(0, true, clickingPlayer);
    agenda.setVoteLocked(1, true, clickingPlayer);
    agenda.setVoteLocked(2, true, clickingPlayer);
    agenda.setVoteLocked(3, true, clickingPlayer);
    agenda.setVoteLocked(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "VOTE");
    agenda.setVoteLocked(5, true, clickingPlayer);

    // Finished the VOTE phase.
    assert.equal(agenda.getStateMachine().name, "FINISH");

    world.__clear();
});

it("play when", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Play when.
    agenda.playWhen(0, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    // Play when early (ignored).
    agenda.playWhen(4, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    // Rest pass.
    agenda.setNoWhens(1, true, clickingPlayer);
    agenda.setNoWhens(2, true, clickingPlayer);
    agenda.setNoWhens(3, true, clickingPlayer);
    agenda.setNoWhens(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");
    agenda.setNoWhens(5, true, clickingPlayer);

    // Go back to first player who played when.
    assert.equal(agenda.getStateMachine().name, "WHEN");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);

    agenda.setNoWhens(0, true, clickingPlayer);

    // Starting the AFTER phase.
    assert.equal(agenda.getStateMachine().name, "AFTER");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
});

it("play after", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    // Advance to AFTER.
    agenda.getStateMachine().setState("AFTER");
    assert.equal(agenda.getStateMachine().name, "AFTER");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "AFTER");

    // Play after.
    agenda.playAfter(0, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    // Play after early (ignored).
    agenda.playAfter(4, clickingPlayer);
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    // Rest pass.
    agenda.setNoAfters(1, true, clickingPlayer);
    agenda.setNoAfters(2, true, clickingPlayer);
    agenda.setNoAfters(3, true, clickingPlayer);
    agenda.setNoAfters(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "AFTER");
    agenda.setNoAfters(5, true, clickingPlayer);

    // Go back to first player who played when.
    assert.equal(agenda.getStateMachine().name, "AFTER");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);

    agenda.setNoAfters(0, true, clickingPlayer);

    // Starting the AFTER phase.
    assert.equal(agenda.getStateMachine().name, "VOTE");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);
});

it("early no afters during whens phase", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Early no afters.
    // We are NOT in the relevant phase.
    agenda.setNoAfters(0, true, clickingPlayer);
    agenda.setNoAfters(1, true, clickingPlayer);
    agenda.setNoAfters(2, true, clickingPlayer);
    agenda.setNoAfters(3, true, clickingPlayer);
    agenda.setNoAfters(4, true, clickingPlayer);
    agenda.setNoAfters(5, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Now do whens.
    agenda.setNoWhens(0, true, clickingPlayer);
    agenda.setNoWhens(1, true, clickingPlayer);
    agenda.setNoWhens(2, true, clickingPlayer);
    agenda.setNoWhens(3, true, clickingPlayer);
    agenda.setNoWhens(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");
    agenda.setNoWhens(5, true, clickingPlayer);

    // SKIP the AFTER phase.
    assert.equal(agenda.getStateMachine().name, "VOTE");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    world.__clear();
});

it("partial early no afters during whens phase", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Early no afters.
    // We are NOT in the relevant phase.
    agenda.setNoAfters(0, true, clickingPlayer);
    agenda.setNoAfters(1, true, clickingPlayer);
    agenda.setNoAfters(2, true, clickingPlayer);
    agenda.setNoAfters(3, true, clickingPlayer);
    //agenda.setNoAfters(4, true, clickingPlayer);
    agenda.setNoAfters(5, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Now do whens.
    agenda.setNoWhens(0, true, clickingPlayer);
    agenda.setNoWhens(1, true, clickingPlayer);
    agenda.setNoWhens(2, true, clickingPlayer);
    agenda.setNoWhens(3, true, clickingPlayer);
    agenda.setNoWhens(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");
    agenda.setNoWhens(5, true, clickingPlayer);

    // Only the one after remains.
    assert.equal(agenda.getStateMachine().name, "AFTER");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 4);

    agenda.setNoAfters(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "VOTE");
    current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 1);

    world.__clear();
});

it("early no afters AND vote lock during whens phase", () => {
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

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Desk 0 is speaker, no one has passed.
    agenda.resetForCurrentState(clickingPlayer);
    let current = world.TI4.turns.getCurrentTurn();
    assert.equal(current.index, 0);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Early no afters.
    // We are NOT in the relevant phase.
    agenda.setNoAfters(0, true, clickingPlayer);
    agenda.setNoAfters(1, true, clickingPlayer);
    agenda.setNoAfters(2, true, clickingPlayer);
    agenda.setNoAfters(3, true, clickingPlayer);
    agenda.setNoAfters(4, true, clickingPlayer);
    agenda.setNoAfters(5, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Early vote locks.
    // We are NOT in the relevant phase.
    agenda.setVoteLocked(0, true, clickingPlayer);
    agenda.setVoteLocked(1, true, clickingPlayer);
    agenda.setVoteLocked(2, true, clickingPlayer);
    agenda.setVoteLocked(3, true, clickingPlayer);
    agenda.setVoteLocked(4, true, clickingPlayer);
    agenda.setVoteLocked(5, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");

    // Now do whens.
    agenda.setNoWhens(0, true, clickingPlayer);
    agenda.setNoWhens(1, true, clickingPlayer);
    agenda.setNoWhens(2, true, clickingPlayer);
    agenda.setNoWhens(3, true, clickingPlayer);
    agenda.setNoWhens(4, true, clickingPlayer);
    assert.equal(agenda.getStateMachine().name, "WHEN");
    agenda.setNoWhens(5, true, clickingPlayer);

    // SKIP afters, votes
    assert.equal(agenda.getStateMachine().name, "FINISH");

    world.__clear();
});

it("summarize votes", () => {
    world.__clear();

    // Need speaker token to get agenda turn order.
    const desks = world.TI4.getAllPlayerDesks();
    const speakerToken = new MockGameObject({
        templateMetadata: "token:base/speaker",
        position: desks[0].center,
    });
    world.__addObject(speakerToken);

    const agenda = new Agenda()
        .init()
        .start()
        .resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    const clickingPlayer = new MockPlayer();

    let summary;
    let deskIndex;
    let outcomeIndex;
    let voteCount;

    summary = agenda.summarizeVotes();
    assert.equal(summary, "“For”: 0, “Against”: 0");

    deskIndex = 2;
    outcomeIndex = 1;
    voteCount = 3;
    agenda.setVoteOutcomeIndex(deskIndex, outcomeIndex, clickingPlayer);
    agenda.setVoteCount(deskIndex, voteCount, clickingPlayer);
    summary = agenda.summarizeVotes();
    assert.equal(summary, "“For”: 0, “Against”: 3 (purple)");

    deskIndex = 3;
    outcomeIndex = 1;
    voteCount = 4;
    agenda.setVoteOutcomeIndex(deskIndex, outcomeIndex, clickingPlayer);
    agenda.setVoteCount(deskIndex, voteCount, clickingPlayer);
    summary = agenda.summarizeVotes();
    assert.equal(summary, "“For”: 0, “Against”: 7 (purple, yellow)");

    deskIndex = 4;
    outcomeIndex = 0;
    voteCount = 5;
    agenda.setVoteOutcomeIndex(deskIndex, outcomeIndex, clickingPlayer);
    agenda.setVoteCount(deskIndex, voteCount, clickingPlayer);
    summary = agenda.summarizeVotes();
    assert.equal(summary, "“For”: 5 (red), “Against”: 7 (purple, yellow)");

    world.__clear();
});
