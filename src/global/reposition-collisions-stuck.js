const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const {
    GameObject,
    ObjectType,
    globalEvents,
    world,
} = require("../wrapper/api");

/**
 * Several reports of a "clicking" sound where it has been fixed by selecting
 * an area of objects, picking them up, and dropping them.  This suggests
 * physics doesn't always dampen to a resting state.
 *
 * Listen for collisions, if an object gets too many over a span of time,
 * reposition that object (snap to ground).
 */

const HISTORY_SECONDS = 30;
const MAX_COLLISIONS = 60;

const _pairToCollisionHistory = {}; // between specific objects
const _fixedPairs = [];

const _onHitHandler = (obj, otherObj, first, impactPoint, impulse) => {
    assert(obj instanceof GameObject);

    // Compute deterministic key.
    let id1 = obj.getId();
    let id2 = otherObj ? otherObj.getId() : "NULL";
    let nsid1 = ObjectNamespace.getNsid(obj);
    let nsid2 = otherObj ? ObjectNamespace.getNsid(otherObj) : "NULL";
    let type1 = obj.getObjectType();
    let type2 = otherObj ? otherObj.getObjectType() : "-1";
    if (id1 > id2) {
        [id1, id2] = [id2, id1];
        [nsid1, nsid2] = [nsid2, nsid1];
        [type1, type2] = [type2, type1];
    }
    const pair = `[${id1} ${nsid1} ${type1}] + [${id2} ${nsid2} ${type2}]`;

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

    // Touch unlocked objects.
    for (const candidate of [obj, otherObj]) {
        if (candidate === undefined) {
            continue;
        }
        if (candidate.getObjectType() !== ObjectType.Regular) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(candidate);
        //console.log(`COLLISION UNSTICKING "${nsid}"`);
        const pos = candidate.getPosition().add([0, 0, 0.021]);
        candidate.setPosition(pos);
    }

    // Clear the entry.
    delete _pairToCollisionHistory[pair];

    // Report what's getting snapped (and does it keep happening).
    if (_fixedPairs.length < 10) {
        _fixedPairs.push(pair);
        if (_fixedPairs.length === 1 || _fixedPairs.length === 10) {
            const msg = `FIXED COLLISIONS:\n${_fixedPairs.join("\n")}`;
            world.TI4.errorReporting.error(msg);
        }
    }
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
