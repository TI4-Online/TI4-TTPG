const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const {
    Card,
    GameObject,
    Player,
    globalEvents,
    world,
} = require("../../wrapper/api");

function score(scorableCard, player) {
    assert(scorableCard instanceof Card);
    assert(player instanceof Player);

    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        return;
    }
    const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
    if (!faction) {
        return;
    }

    // const localPos = playerDesk.center
    //     .multiply(0.01)
    //     .rotateAngleAxis(90, [0, 0, 1]);
    // const pos = scorableCard.localPositionToWorld(localPos);
    const pos = scorableCard.getPosition(); // TODO XXX BETTER PLACEMENT
    pos.z = scorableCard.getPosition().z + 5;

    const tokenNsid = `token.control:${faction.nsidSource}/${faction.nsidName}`;
    const rot = scorableCard.getRotation();
    const color = playerDesk.color;
    const token = Spawn.spawn(tokenNsid, pos, rot);
    token.setOwningPlayerSlot(playerSlot);
    token.setPrimaryColor(color);
}

function isScorable(obj) {
    assert(obj instanceof GameObject);
    // TODO XXX Custodians
    if (!(obj instanceof Card)) {
        return false;
    }
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid.startsWith("card.objective")) {
        return true;
    }
}

function addRightClickOptions(scorableCard) {
    assert(scorableCard instanceof Card);
    const actionName = "*" + locale("ui.menu.score");
    scorableCard.addCustomAction(actionName);
    scorableCard.onCustomAction.add((obj, player, selectedActionName) => {
        if (selectedActionName === actionName) {
            score(scorableCard, player);
        }
    });
    scorableCard.__hasRightClickScoreOption = true;
}

function removeRightClickOptions(scorableCard) {
    assert(scorableCard instanceof Card);
    const actionName = "*" + locale("ui.menu.score");
    scorableCard.removeCustomAction(actionName);
    scorableCard.__hasRightClickScoreOption = false;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    if (isScorable(card)) {
        addRightClickOptions(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasRightClickAgendaOptions) {
        removeRightClickOptions(card);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (isScorable(obj)) {
            addRightClickOptions(obj);
        }
    }
}
