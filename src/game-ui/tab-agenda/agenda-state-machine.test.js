const assert = require("assert");
const { AgendaStateMachine } = require("./agenda-state-machine");

it("constructor", () => {
    const asm = new AgendaStateMachine();
    assert.equal(asm.main, "START.MAIN");
    assert(!asm.active);
    assert(!asm.waiting);
});

it("transitions", () => {
    const asm = new AgendaStateMachine();
    assert.equal(asm.main, "START.MAIN");
    assert(!asm.active);
    assert(!asm.waiting);

    asm.next();
    assert.equal(asm.main, "OUTCOME_TYPE.MAIN");
    assert(!asm.active);
    assert(!asm.waiting);

    asm.next();
    assert.equal(asm.main, "WHEN.MAIN");
    assert.equal(asm.active, "WHEN.START");
    assert.equal(asm.waiting, "WHEN.WAITING");

    asm.next();
    assert.equal(asm.main, "WHEN.MAIN");
    assert.equal(asm.active, "WHEN.FINISH");
    assert.equal(asm.waiting, "WHEN.WAITING");

    asm.next();
    assert.equal(asm.main, "AFTER.MAIN");
    assert.equal(asm.active, "AFTER.START");
    assert.equal(asm.waiting, "AFTER.WAITING");
});
