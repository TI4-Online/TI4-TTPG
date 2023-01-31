const assert = require("../wrapper/assert-wrapper");
const { GameObject, globalEvents, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

/**
 * Several reports of a "clicking" sound where it has been fixed by selecting
 * an area of objects, picking them up, and dropping them.  This suggests
 * physics doesn't always dampen to a resting state.
 *
 * Listen for collisions, if an object gets too many over a span of time,
 * reposition that object (pick up, snap to ground).
 *
 * FOR NOW JUST REPORT WHAT IS HAPPENING.  DO NOT MOVE ANYTHING!
 */

const HISTORY_SECONDS = 30;
const MAX_COLLISIONS = 60;

const _pairToCollisionHistory = {}; // between specific objects
let _active = true;

const _report = () => {
    console.log("collisions report");

    const pairs = Object.entries(_pairToCollisionHistory)
        .map(([pair, history]) => {
            return `${String(history.length).padStart(3, "0")} ${pair}`;
        })
        .sort()
        .reverse();

    // Message size is limited to 2k characters.
    let msg = ["COLLISIONS:"];
    let size = msg[0].length + 2;
    for (const pair of pairs) {
        if (size + pair.length + 2 > 1900) {
            break;
        }
        msg.push(pair);
    }
    msg = msg.join("\n");
    console.log(msg);
    world.TI4.errorReporting.error(msg);
};

const _onHitHandler = (obj, otherObj, first, impactPoint, impulse) => {
    assert(obj instanceof GameObject);

    if (!_active) {
        return;
    }

    // Compute deterministic key.
    let id1 = obj.getId();
    let id2 = otherObj ? otherObj.getId() : "NULL";
    let nsid1 = ObjectNamespace.getNsid(obj);
    let nsid2 = otherObj ? ObjectNamespace.getNsid(otherObj) : "NULL";
    if (id1 > id2) {
        [id1, id2] = [id2, id1];
        [nsid1, nsid2] = [nsid2, nsid1];
    }
    const pair = `"${id1}" (${nsid1}) + "${id2}" (${nsid2})`;

    // Get history.
    let history = _pairToCollisionHistory[pair];
    if (!history) {
        history = [];
        _pairToCollisionHistory[pair] = history;
    }

    // Retire aged values.
    const nowSeconds = Date.now() / 1000;
    const minSeconds = nowSeconds - HISTORY_SECONDS;
    while (history.length > 0 && history[0] < minSeconds) {
        history.shift();
    }

    // Add new value.
    history.push(nowSeconds);

    // Acceptable?
    if (history.length < MAX_COLLISIONS) {
        return; // all is well
    }

    // Do a *single* report.  The goal is to get a sense of frequency and
    // what objects aren't settling.
    _active = false;
    _report();
};

const _periodicCleanup = () => {
    const nowSeconds = Date.now() / 1000;
    const minSeconds = nowSeconds - HISTORY_SECONDS;
    for (const [pair, history] of Object.entries(_pairToCollisionHistory)) {
        while (history.length > 0 && history[0] < minSeconds) {
            history.shift();
        }
        if (history.length === 0) {
            delete _pairToCollisionHistory[pair];
        }
    }
};
if (!world.__isMock) {
    setInterval(_periodicCleanup, 10 * 1000);
}

globalEvents.onObjectCreated.add((obj) => {
    assert(obj instanceof GameObject);
    obj.onHit.add(_onHitHandler);
});

if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        obj.onHit.add(_onHitHandler);
    }
}
