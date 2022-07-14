require("../../global"); // create world.TI4
const assert = require("assert");
const { TabAgenda } = require("./tab-agenda");
const { OUTCOME_TYPE } = require("../../lib/agenda/agenda-outcome");
const { world } = require("../../wrapper/api");

it("constructor", () => {
    new TabAgenda();
});

it("states", () => {
    const agenda = world.TI4.agenda;
    const tabAgenda = new TabAgenda();

    // Send event before agenda is there.
    assert(!agenda.isActive());
    tabAgenda.update();

    // Start the agenda.
    agenda.init();
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "WAITING_FOR_START");
    tabAgenda.update();

    agenda.start();
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "OUTCOME_TYPE");
    tabAgenda.update();

    agenda.resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "WHEN");
    tabAgenda.update();

    agenda.getStateMachine().next();
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "AFTER");
    tabAgenda.update();

    agenda.getStateMachine().next();
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "VOTE");
    tabAgenda.update();

    agenda.getStateMachine().next();
    assert(agenda.isActive());
    assert.equal(agenda.getStateMachine().name, "FINISH");
    tabAgenda.update();

    agenda.clear();
    assert(!agenda.isActive());
});
