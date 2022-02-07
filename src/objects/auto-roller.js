const assert = require("../wrapper/assert");
const { AuxDataPair } = require("../lib/unit/auxdata-pair");
const { CombatRoller } = require("../lib/combat/combat-roller");
const { Hex } = require("../lib/hex");
const {
    GameObject,
    Player,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("../wrapper/api");

let _activeSystemHex = false;
let _activatingPlayerSlot = false;

globalEvents.TI4.onSystemActivated.add((systemTile, player) => {
    assert(systemTile instanceof GameObject);
    assert(player instanceof Player);
    _activeSystemHex = Hex.fromPosition(systemTile.getPosition());
    _activatingPlayerSlot = player.getSlot();
});

refObject.onCreated.add((obj) => {
    new AutoRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AutoRoller(refObject);
}

class AutoRoller {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
    }

    roll(rollType, planet, player) {
        if (!_activeSystemHex) {
            // TODO XXX Broadcast error
            return;
        }

        // Clicking player is always the roller.
        const playerSlot1 = player.getSlot();

        // Opponent is the activating player if not also the clicking player.
        // If clicking player is active player, let AuxDataPair figure it out.
        let playerSlot2 = _activatingPlayerSlot;
        if (playerSlot2 === playerSlot1) {
            playerSlot2 = -1; // determine opponent by inspecting plastic
        }
        const auxDataPair = new AuxDataPair(
            playerSlot1,
            playerSlot2,
            _activeSystemHex,
            planet
        );
        const [aux1, aux2] = auxDataPair.getPairSync();
        assert(aux1 && aux2);

        // COMBAT TIME!!
        const combatRoller = new CombatRoller(aux1, rollType, player);
        const dicePos = new Vector(0, 0, world.getTableHeight());
        combatRoller.roll(dicePos);
    }
}
