const assert = require("assert");
const { AgendaStateMachine, STATES } = require("./agenda-state-machine");

it("constructor", () => {
    const asm = new AgendaStateMachine();
    assert.equal(asm.main, "WAITING_FOR_START.MAIN");
    assert(!asm.active);
    assert(!asm.waiting);
});

it("transitions", () => {
    const asm = new AgendaStateMachine();
    assert.equal(asm.name, "WAITING_FOR_START");
    assert.equal(asm.main, "WAITING_FOR_START.MAIN");
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.name, "OUTCOME_TYPE");
    assert.equal(asm.main, "OUTCOME_TYPE.MAIN");
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.name, "WHEN");
    assert.equal(asm.main, "WHEN.MAIN");
    assert.equal(asm.desk, "WHEN-AFTER-VOTE.DESK");

    asm.next();
    assert.equal(asm.name, "AFTER");
    assert.equal(asm.main, "AFTER.MAIN");
    assert.equal(asm.desk, "WHEN-AFTER-VOTE.DESK");

    asm.next();
    assert.equal(asm.name, "VOTE");
    assert.equal(asm.main, "VOTE.MAIN");
    assert.equal(asm.desk, "WHEN-AFTER-VOTE.DESK");

    //asm.next();
    //assert.equal(asm.main, "POST.MAIN");
    //assert.equal(asm.desk, "WHEN-AFTER-VOTE.DESK");

    asm.next();
    assert.equal(asm.main, "FINISH.MAIN");
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.main, "WAITING_FOR_START.MAIN");
    assert(!asm.desk);
});

it("all fields", () => {
    for (const state of STATES) {
        assert(typeof state.name === "string");
        assert(typeof state.main === "string");
        assert(!state.desk || typeof state.desk === "string"); // optional
        assert(typeof state.next === "string");
    }
});
