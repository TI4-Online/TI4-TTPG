const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { Facing } = require("../../lib/facing");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const { Scoreboard } = require("../../lib/scoreboard/scoreboard");
const { Spawn } = require("../../setup/spawn/spawn");
const {
    Card,
    GameObject,
    Player,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

const SCORE_ACTION_NAME = "*" + locale("ui.menu.score");

const OTHER_SCORABLE_NSIDS = new Set([
    "card.action:base/imperial_rider",
    "card.agenda:base.only/holy_planet_of_ixth",
    "card.agenda:base.only/shard_of_the_throne",
    "card.agenda:base.only/the_crown_of_emphidia",
    "card.agenda:base/mutiny",
    "card.agenda:base/seed_of_an_empire",
    "card.agenda:pok/political_censure",
    "card.relic:pok/shard_of_the_throne",
    "card.relic:pok/the_crown_of_emphidia",
    "token:base/custodians",
]);

function isScorable(obj) {
    assert(obj instanceof GameObject);
    const nsid = ObjectNamespace.getNsid(obj);

    if (OTHER_SCORABLE_NSIDS.has(nsid)) {
        return true;
    }
    if (
        nsid.startsWith("card.promissory") &&
        nsid.endsWith("/support_for_the_throne")
    ) {
        return true;
    }
    return nsid.startsWith("card.objective");
}

function _isOnLawsOrObjectiveMat(card) {
    const mats = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "mat:base/objectives_1") {
            mats.push(obj);
        } else if (nsid === "mat:base/objectives_2") {
            mats.push(obj);
        } else if (nsid === "mat:base/laws") {
            mats.push(obj);
        } else if (nsid === "mat:base/agenda") {
            mats.push(obj);
        }
    }

    for (const mat of mats) {
        const pos = mat.worldPositionToLocal(card.getPosition());
        const extent = mat.getExtent();
        if (Math.abs(pos.x) < extent.x && Math.abs(pos.y) < extent.y) {
            return true;
        }
    }
    return false;
}

function isSecretsHolderScorable(obj) {
    const nsid = ObjectNamespace.getNsid(obj);

    // Special case for "classified documents leaks" where a secret becomes
    // a public objective.  If a secret is on the laws or objective mats
    // treat it as a place-token item.
    if (
        nsid.startsWith("card.objective.secret") &&
        _isOnLawsOrObjectiveMat(obj)
    ) {
        return false;
    }

    if (
        nsid.startsWith("card.promissory") &&
        nsid.endsWith("/support_for_the_throne")
    ) {
        return true;
    }
    return nsid.startsWith("card.objective.secret");
}

function addControlToken(scoreableObj, playerSlot) {
    assert(scoreableObj instanceof GameObject);
    assert(typeof playerSlot === "number");

    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        console.log("addControlToken: no desk");
        return;
    }
    const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
    if (!faction) {
        console.log("addControlToken: no faction");
        return;
    }

    const playerCount = world.TI4.config.playerCount;
    let index = playerCount - playerDesk.index - 1;
    let pos;
    if (scoreableObj instanceof Card) {
        const numLeft = Math.floor(playerCount / 2);
        if (index >= numLeft) {
            index = playerCount - (index - numLeft) - 1;
        }
        const col = index < numLeft ? 0 : 1;
        const row = index - col * numLeft;
        const x = (row - (numLeft - 1) / 2) * 2.3;
        const y = (col - 0.5) * 3;
        //console.log(`[${index}]: (${col}, ${row}) => (${x}, ${y})`);
        pos = new Vector(x, y, -3 - index);
    } else {
        const extent = scoreableObj.getExtent();
        const fuzz = Math.min(extent.x, extent.y);
        const x = (Math.random() - 0.5) * 1.5 * fuzz;
        const y = (Math.random() - 0.5) * 1.5 * fuzz;
        pos = new Vector(x, y, 3 + index);
    }
    if (Facing.isFaceDown(scoreableObj)) {
        pos.y = -pos.y;
        pos.z = -pos.z;
    }
    pos = scoreableObj.localPositionToWorld(pos);

    const tokenNsid = `token.control:${faction.nsidSource}/${faction.nsidName}`;
    const rot = scoreableObj.getRotation();
    const color = playerDesk.color;
    const token = Spawn.spawn(tokenNsid, pos, rot);
    token.setOwningPlayerSlot(playerSlot);
    token.setPrimaryColor(color);
}

function moveToSecretsHolder(scoreableObj, playerSlot) {
    assert(scoreableObj instanceof Card);
    assert(typeof playerSlot === "number");

    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        console.log("moveToSecretsHolder: no desk");
        return;
    }
    const playerIndex = playerDesk.index;

    let holder = false;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid !== "cardholder:base/small") {
            continue;
        }
        const deskIndex = ObjectSavedData.get(obj, "deskIndex", -1);
        if (deskIndex !== playerIndex) {
            continue;
        }
        holder = obj;
        break;
    }
    if (!holder) {
        console.log("moveToSecretsHolder: no holder");
        return;
    }

    const currentHolder = scoreableObj.getHolder();
    if (currentHolder) {
        if (currentHolder === holder) {
            return; // already there
        } else {
            scoreableObj.removeFromHolder();
        }
    }

    const yaw = holder.getRotation().yaw;
    scoreableObj.setRotation([0, yaw, 180]);
    holder.insert(scoreableObj);
}

function advanceScoreboardToken(player, points) {
    assert(player instanceof Player);
    assert(typeof points === "number");

    const scoreboard = Scoreboard.getScoreboard();
    if (!scoreboard) {
        return;
    }

    const playerSlot = player.getSlot();
    const playerSlotToTokens = Scoreboard.getPlayerSlotToTokens(scoreboard);
    const tokens = playerSlotToTokens[playerSlot];
    if (!tokens || tokens.length > 1) {
        return;
    }
    const token = tokens[0];

    const oldScore = Scoreboard.getScoreFromToken(scoreboard, token);
    let newScore = oldScore + points;
    newScore = Math.min(newScore, world.TI4.config.gamePoints);

    const posRot = Scoreboard.getTokenScoreboardPosRot(
        scoreboard,
        newScore,
        playerSlot
    );
    token.setPosition(posRot.pos, 1);
    token.setRotation(posRot.rot, 1);
}

function score(scoreableObj, player) {
    assert(scoreableObj instanceof GameObject);
    assert(player instanceof Player);

    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    if (!playerDesk) {
        console.log("score: no desk");
        return;
    }

    // Announce.
    const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
    const playerName = faction ? faction.nameAbbr : playerDesk.colorName;
    const scoredName =
        scoreableObj instanceof Card
            ? scoreableObj.getCardDetails().name
            : scoreableObj.getName();
    const msg = locale("ui.message.score", { playerName, scoredName });
    Broadcast.chatAll(msg, playerDesk.chatColor);

    // Mark scored.
    if (isSecretsHolderScorable(scoreableObj)) {
        moveToSecretsHolder(scoreableObj, playerSlot);
    } else {
        addControlToken(scoreableObj, playerSlot);
    }

    // Move player's scoreboard token.
    const scoreableNsid = ObjectNamespace.getNsid(scoreableObj);
    let points = 1;
    if (scoreableNsid.startsWith("card.objective.public_2")) {
        points = 2;
    }
    advanceScoreboardToken(player, points);

    // Tell any listeners.
    globalEvents.TI4.onScored.trigger(scoreableObj, player);
}

function maybeScore(obj, player, selectedActionName) {
    // Cards outside a hand must be face up to be scorable.
    // (Careful, custodians token is not a card.)
    if (obj instanceof Card && !obj.isInHolder() && !obj.isFaceUp()) {
        return;
    }
    if (selectedActionName === SCORE_ACTION_NAME) {
        score(obj, player);
    }
}

// AbstractRightClickCard cannot currently also add to the custodians token.
function addRightClickOptions(scoreableObj) {
    assert(scoreableObj instanceof GameObject);
    scoreableObj.addCustomAction(SCORE_ACTION_NAME);
    scoreableObj.onCustomAction.remove(maybeScore);
    scoreableObj.onCustomAction.add(maybeScore);
    scoreableObj.__hasRightClickScoreOption = true;
}

function removeRightClickOptions(scoreableObj) {
    assert(scoreableObj instanceof GameObject);
    scoreableObj.removeCustomAction(SCORE_ACTION_NAME);
    scoreableObj.onCustomAction.remove(maybeScore);
    scoreableObj.__hasRightClickScoreOption = false;
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

for (const obj of world.getAllObjects()) {
    if (isScorable(obj)) {
        addRightClickOptions(obj);
    }
}

class RightClickScore {
    static injectOtherScorableNSID(nsid) {
        if (typeof nsid !== "string") {
            throw new Error(
                "RightClickScore.injectOtherScorableNSID: not a string"
            );
        }
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            throw new Error(
                "RightClickScore.injectOtherScorableNSID: not an nsid"
            );
        }
        OTHER_SCORABLE_NSIDS.add(nsid);
    }
}

module.exports = { RightClickScore };
