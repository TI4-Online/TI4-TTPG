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
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.main, "OUTCOME_TYPE.MAIN");
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.main, "WHEN.MAIN");
    assert.equal(asm.desk, "WHEN-AFTER.DESK");

    asm.next();
    assert.equal(asm.main, "AFTER.MAIN");
    assert.equal(asm.desk, "WHEN-AFTER.DESK");

    asm.next();
    assert.equal(asm.main, "VOTE.MAIN");
    assert.equal(asm.desk, "VOTE.DESK");

    asm.next();
    assert.equal(asm.main, "POST.MAIN");
    assert.equal(asm.desk, "VOTE.DESK");

    asm.next();
    assert.equal(asm.main, "FINISH.MAIN");
    assert(!asm.desk);

    asm.next();
    assert.equal(asm.main, "START.MAIN");
    assert(!asm.desk);
});
