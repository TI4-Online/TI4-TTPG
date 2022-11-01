const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { PopupPanel } = require("../../lib/ui/popup-panel");
const {
    Container,
    GameObject,
    Player,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");

const ACTION_REPLACE_WITH_PDS = "*" + locale("ui.menu.sleeper_to_pds");
const ACTION_REPLACE_WITH_MECH_INF =
    "*" + locale("ui.menu.sleeper_to_mech_inf");

function replaceWithAndReturnTurn(
    sleeperToken,
    player,
    replacementContainerNsids
) {
    assert(sleeperToken instanceof GameObject);
    assert(player instanceof Player);
    assert(Array.isArray(replacementContainerNsids));

    const nsid = ObjectNamespace.getNsid(sleeperToken);
    assert(nsid === "token.ul:pok/sleeper");

    // Validate clicking player.
    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        console.log("SleeperToken.replace: no desk for player, aborting");
        return;
    }

    // Find and validate unit supply.
    const replacementContainers = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!(obj instanceof Container)) {
            continue;
        }
        if (obj.getOwningPlayerSlot() !== playerSlot) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (!replacementContainerNsids.includes(nsid)) {
            continue;
        }
        replacementContainers.push(obj);
    }
    if (replacementContainers.length !== replacementContainerNsids.length) {
        console.log(
            "SleeperToken.replace: wrong number of containers, aborting"
        );
        return;
    }
    for (const container of replacementContainers) {
        if (container.getNumItems() === 0) {
            const nsid = ObjectNamespace.getNsid(container);
            const name = ObjectNamespace.parseNsid(nsid).name;
            const msg = locale("ui.error.empty_supply", { unit_name: name });
            Broadcast.chatOne(player, msg, [1, 0, 0]);
            return;
        }
    }

    const pos = sleeperToken.getPosition();
    replacementContainers.forEach((container, index) => {
        const above = pos.add([index, 0, 10]);
        container.takeAt(0, above, true);
    });

    // All containers are present and have capacity.
    sleeperToken.setPosition(playerDesk.center.add([0, 0, 10]), 1);
}

function addRightClickOptions(obj) {
    assert(obj instanceof GameObject);

    const nsid = ObjectNamespace.getNsid(obj);
    assert(nsid === "token.ul:pok/sleeper");

    // Sanity check only added once.
    assert(!obj.__hasRightClickSleeperTokenOptions);
    obj.__hasRightClickSleeperTokenOptions = true;

    obj.addCustomAction(ACTION_REPLACE_WITH_PDS);
    obj.addCustomAction(ACTION_REPLACE_WITH_MECH_INF);

    obj.onCustomAction.add((obj, player, actionName) => {
        assert(player instanceof Player);
        if (actionName === ACTION_REPLACE_WITH_PDS) {
            replaceWithAndReturnTurn(obj, player, ["bag.unit:base/pds"]);
        }
        if (actionName === ACTION_REPLACE_WITH_MECH_INF) {
            replaceWithAndReturnTurn(obj, player, [
                "bag.unit:pok/mech",
                "bag.unit:base/infantry",
            ]);
        }
    });
}

// Do not add UI during onCreated, wait a second frame for good measure.
function delayedAddRightClickOptions(obj) {
    process.nextTick(() => {
        process.nextTick(() => {
            addRightClickOptions(obj);
        });
    });
}

function maybeDelayedAddRightClickOptions(obj) {
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid === "token.ul:pok/sleeper") {
        delayedAddRightClickOptions(obj);
    }
}

globalEvents.onObjectCreated.add((obj) => {
    maybeDelayedAddRightClickOptions(obj);
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        maybeDelayedAddRightClickOptions(obj);
    }
}
