const assert = require("../wrapper/assert");
const { AutoRollerUI } = require("./auto-roller-ui");
const { AuxDataPair } = require("../lib/unit/auxdata-pair");
const { CombatRoller } = require("../lib/combat/combat-roller");
const { Hex } = require("../lib/hex");
const { System } = require("../lib/system/system");

const {
    GameObject,
    Player,
    UIElement,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("../wrapper/api");

refObject.onCreated.add((obj) => {
    new AutoRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AutoRoller(refObject);
}

/**
 * Add this script to a TTPG object to create the auto-roller.
 */
class AutoRoller {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        this._obj = gameObject;
        this._activeSystem = false;
        this._activeHex = false;
        this._activatingPlayerSlot = false;

        this._ui = new AutoRollerUI(this);
        this._ui.setAfterSystemActivation();

        globalEvents.TI4.onSystemActivated.add(this.onSystemActivated);
    }

    onSystemActivated(systemTile, player) {
        assert(systemTile instanceof GameObject);
        assert(player instanceof Player);

        this._activeSystem = System.getBySystemTileObject(systemTile);
        this._activeHex = Hex.fromPosition(systemTile.getPosition());
        this._activatingPlayerSlot = player.getSlot();
        assert(this._activeSystem);
        assert(this._activeHex);
        assert(this._activatingPlayerSlot >= 0);

        this._ui.setAfterSystemActivation(this._activeSystem);
    }

    roll(rollType, planet, player) {
        if (!this._activeSystemHex) {
            // TODO XXX Broadcast error
            return;
        }

        // Clicking player is always the roller.
        const playerSlot1 = player.getSlot();

        // Opponent is the activating player if not also the clicking player.
        // If clicking player is active player, let AuxDataPair figure it out.
        let playerSlot2 = this._activatingPlayerSlot;
        if (playerSlot2 === playerSlot1) {
            playerSlot2 = -1; // determine opponent by inspecting plastic
        }
        const auxDataPair = new AuxDataPair(
            playerSlot1,
            playerSlot2,
            this._activeSystemHex,
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
