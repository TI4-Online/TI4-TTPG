/**
 * Press the R key on a relevant object (potentially with other selected
 * objects) to swap, split, or combine.
 */
const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Facing } = require("../lib/facing");
const { Spawn } = require("../setup/spawn/spawn");
const {
    Container,
    GameObject,
    Player,
    Rotator,
    globalEvents,
    world,
} = require("../wrapper/api");

// NSID to short name for easier to read replace rules.
const METADATA_TO_INFO = {
    "unit:base/fighter": { name: "fighter" },
    "token:base/fighter_1": { name: "fighter_x1" },
    "token:base/fighter_3": { name: "fighter_x3" },
    "unit:base/infantry": { name: "infantry" },
    "token:base/infantry_1": { name: "infantry_x1" },
    "token:base/infantry_3": { name: "infantry_x3" },
    "token:base/tradegood_commodity_1": { name: "tradegood_x1" },
    "token:base/tradegood_commodity_3": { name: "tradegood_x3" },
};

const REPLACE_RULES = [
    // COMBINE (x1,x1,x1) -> (x3), REPEAT
    {
        repeat: true,
        consume: { count: 3, names: ["fighter_x1", "fighter"] },
        produce: { count: 1, name: "fighter_x3" },
    },
    {
        repeat: true,
        consume: { count: 3, names: ["infantry_x1", "infantry"] },
        produce: { count: 1, name: "infantry_x3" },
    },
    {
        repeat: true,
        faceUp: true,
        consume: { count: 3, name: "tradegood_x1" },
        produce: { count: 1, name: "tradegood_x3" },
    },
    {
        repeat: true,
        faceDown: true,
        consume: { count: 3, name: "tradegood_x1" },
        produce: { count: 1, name: "tradegood_x3" },
    },

    // SPLIT (x3) -> (x1,x1,x1), DOES NOT REPEAT
    {
        consume: { count: 1, name: "fighter_x3" },
        produce: { count: 3, name: "fighter_x1" },
    },
    {
        consume: { count: 1, name: "infantry_x3" },
        produce: { count: 3, name: "infantry_x1" },
    },
    {
        faceUp: true,
        consume: { count: 1, name: "tradegood_x3" },
        produce: { count: 3, name: "tradegood_x1" },
    },
    {
        faceDown: true,
        consume: { count: 1, name: "tradegood_x3" },
        produce: { count: 3, name: "tradegood_x1" },
    },

    // SWAP (token) -> (plastic)
    {
        consume: { count: 1, name: "fighter_x1" },
        produce: { count: 1, name: "fighter" },
    },
    {
        consume: { count: 1, name: "infantry_x1" },
        produce: { count: 1, name: "infantry" },
    },

    // SWAP (plastic) -> (token)
    {
        consume: { count: 1, name: "fighter" },
        produce: { count: 1, name: "fighter_x1" },
    },
    {
        consume: { count: 1, name: "infantry" },
        produce: { count: 1, name: "infantry_x1" },
    },
];

/**
 * Get the bag to produce or consume this item type.
 *
 * @param {string} nsid - namespace <type:source/name> id.
 * @param {number} playerSlot
 * @returns
 */
function getUnitBag(nsid, playerSlot) {
    assert(typeof nsid === "string");
    assert(typeof playerSlot === "number");

    assert(nsid.startsWith("unit"));
    const wantNsid = "bag." + nsid;

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue; // ignore inside container
        }
        if (!(obj instanceof Container)) {
            continue; // ignore non-container
        }

        // Normal container.  Unit containers follow "bag.unit:base/fighter",
        // but *all* unit containers for that unit type do.  Also check the
        // owning player slot id.
        const bagNsid = obj.getTemplateMetadata();
        if (wantNsid !== bagNsid) {
            continue; // container is for different type
        }
        const bagSlot = obj.getOwningPlayerSlot();
        if (bagSlot >= 0 && bagSlot !== playerSlot) {
            continue; // container is right type, but wrong player
        }
        return obj;
    }

    throw new Error(`getUnitBag(${nsid}, ${playerSlot}) failed`);
}

/**
 * Does this object match rule.consume?
 *
 * @param {GameObject} obj
 * @param {object} rule - REPLACE_RULES entry
 * @returns {boolean}
 */
function isConsumable(obj, rule) {
    const objInfo = METADATA_TO_INFO[obj.getTemplateMetadata()];
    if (!objInfo) {
        return false;
    } else if (rule.consume.name && rule.consume.name !== objInfo.name) {
        return false;
    } else if (
        rule.consume.names &&
        !rule.consume.names.includes(objInfo.name)
    ) {
        return false;
    } else if (rule.faceUp && Facing.isFaceDown(obj)) {
        return false;
    } else if (rule.faceDown && Facing.isFaceUp(obj)) {
        return false;
    }
    return true;
}

/**
 * Given a list of GameObject and a rule, compute:
 * - Which items to consume.
 * - What nsid to produce and how how many.
 *
 * @param {GameObject[]} objs
 * @param {object} rule - REPLACE_RULES entry
 * @returns {{consume: GameObject[], produce: {nsid: string, count: number}}}
 */
function applyRule(objs, rule) {
    // Gather consumable items, fail if not enough.
    const consumable = objs.filter((obj) => isConsumable(obj, rule));
    if (consumable.length < rule.consume.count) {
        return false;
    }

    // Find the metadata value for the produce name.
    const nameToNsid = (name) => {
        for (const [nsid, entry] of Object.entries(METADATA_TO_INFO)) {
            if (entry.name === name) {
                return nsid;
            }
        }
        throw new Error(`unknown name ${name}`);
    };

    const applyCount = rule.repeat
        ? Math.floor(consumable.length / rule.consume.count)
        : 1;
    return {
        rule: rule,
        consume: consumable.slice(0, rule.consume.count * applyCount),
        produce: {
            nsid: nameToNsid(rule.produce.name),
            count: rule.produce.count * applyCount,
        },
    };
}

function doSwapSplitCombine(objs, player) {
    assert(Array.isArray(objs));
    assert(player instanceof Player);

    const playerSlot = player.getSlot();
    // Discard any objects owned by another player (tokens always match).
    // All objects owned by a player should have owning player slot set.
    objs = objs.filter((obj) => {
        const objSlot = obj.getOwningPlayerSlot();
        return objSlot === -1 || objSlot === playerSlot;
    });

    // Prefer swapping tokens to units (need one plastic!).  Move to front.
    objs = objs.sort((a, b) => {
        const aId = a.getTemplateMetadata();
        const bId = b.getTemplateMetadata();
        if (aId.startsWith("token")) {
            return -1;
        }
        if (bId.startsWith("token")) {
            return 1;
        }
        return 0;
    });

    // Find the first matching rule.
    let match;
    for (const rule of REPLACE_RULES) {
        match = applyRule(objs, rule);
        if (match) {
            break;
        }
    }
    if (!match) {
        return; // no matching rule
    }

    // Make sure the produce can happen (empty unit bag?).
    let produceBag = undefined;
    if (match.produce.nsid.startsWith("unit")) {
        produceBag = getUnitBag(match.produce.nsid, playerSlot);
        if (produceBag.getItems().length < match.produce.count) {
            const message = locale("ui.error.empty_supply", {
                unit_name: match.rule.produce.name,
            });
            player.showMessage(message);
            player.sendChatMessage(message);
            return; // not enough supply to produce
        }
    }

    // Fullfill rule.
    for (const obj of match.consume) {
        const consumeNsid = obj.getTemplateMetadata();
        if (consumeNsid.startsWith("unit")) {
            const consumeBag = getUnitBag(consumeNsid, playerSlot);
            consumeBag.addObjects([obj], 0, true);
        } else {
            obj.destroy();
        }
    }
    let pos = player.getCursorPosition();
    pos.z = world.getTableHeight() + 10;
    for (let i = 0; i < match.produce.count; i++) {
        // Remove from container before moving to final location.
        // Bug report said it fell through the table after take.
        let obj;
        const above = pos.add([0, 0, 10 + i * 3]);
        if (produceBag) {
            obj = produceBag.takeAt(0, above, false);
        } else {
            obj = Spawn.spawn(match.produce.nsid, above, new Rotator(0, 0, 0));
        }
        if (!obj) {
            // "can't happen" but got a report.
            throw new Error(
                "no obj: " +
                    JSON.stringify({
                        match: match,
                        i,
                        produceBag: produceBag ? true : false,
                    })
            );
        }
        obj.setPosition(pos);
        obj.setRotation([match.rule.faceDown ? -180 : 0, 0, 0]);
        obj.snapToGround();
        pos = pos.add(obj.getExtent().multiply(0.2));
    }
}

const _playerSlotToObjs = {};

function onR(obj, player) {
    assert(obj instanceof GameObject);
    assert(player instanceof Player);

    // Only seated players may use R.
    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        const msg = locale("ui.error.only_seated_players_may_r");
        player.sendChatMessage(msg, [1, 0, 0]);
        return;
    }

    // Saw a crash from an object without nsid.  Double check before using.
    const nsid = obj.getTemplateMetadata();
    if (nsid.length === 0 || !METADATA_TO_INFO[nsid]) {
        return;
    }

    // Careful, if multiple objects selected ALL get a separate call!
    // Pressing "R" outside any selected object still calls for each.
    // Moreover, player.getSelectedObjects seems to fail for non-host?
    // Queue objects individually, process gathered set next frame.
    let objs = _playerSlotToObjs[playerSlot];
    let needsProcessing = false;
    if (!objs) {
        objs = [];
        _playerSlotToObjs[playerSlot] = objs;
        needsProcessing = true;
    }

    // Be paranoid, verify object not already pending.
    for (const peer of objs) {
        if (obj.getId() === peer.getId()) {
            return; // already in set!
        }
    }

    objs.push(obj);

    if (needsProcessing) {
        process.nextTick(() => {
            const objs = _playerSlotToObjs[playerSlot];
            delete _playerSlotToObjs[playerSlot];
            doSwapSplitCombine(objs, player);
        });
    }
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (METADATA_TO_INFO[obj.getTemplateMetadata()]) {
        obj.onPrimaryAction.add(onR);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (METADATA_TO_INFO[obj.getTemplateMetadata()]) {
            obj.onPrimaryAction.add(onR);
        }
    }
}

// Export for the unittest.
module.exports = {
    isConsumable,
    applyRule,
    onR,
};
