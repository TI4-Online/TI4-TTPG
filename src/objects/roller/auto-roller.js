const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRollerUI } = require("./auto-roller-ui");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { CombatRoller } = require("../../lib/combat/combat-roller");
const { Hex } = require("../../lib/hex");
const { System, Planet } = require("../../lib/system/system");

const {
    GameObject,
    Player,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const { UnitModifier } = require("../../lib/unit/unit-modifier");

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

        this._ui = new AutoRollerUI(this._obj, (rollType, planet, player) => {
            assert(this instanceof AutoRoller);
            assert(typeof rollType === "string");
            assert(!planet || planet instanceof Planet);
            assert(player instanceof Player);
            console.log(
                `onButton(${rollType}, ${
                    planet && planet.localeName
                }, ${player.getName()})`
            );
            this.roll(rollType, planet, player);
        });

        // Listen for onSystemActivated, remove listener on destroy.
        const handler = (systemTile, player) => {
            assert(this instanceof AutoRoller);
            this.onSystemActivated(systemTile, player);
        };
        globalEvents.TI4.onSystemActivated.add(handler);
        this._obj.onDestroyed.add((obj) => {
            globalEvents.TI4.onSystemActivated.remove(handler);
        });
    }

    /**
     * globalEvents.TI4.onSystemActivated handler.
     *
     * @param {GameObject} systemTile
     * @param {Player} player
     */
    onSystemActivated(systemTile, player) {
        assert(this instanceof AutoRoller);
        assert(systemTile instanceof GameObject);
        assert(player instanceof Player);

        // Reject events if associated object destroyed.
        if (!this._obj.isValid()) {
            return;
        }

        this._activeSystem = System.getBySystemTileObject(systemTile);
        this._activeHex = Hex.fromPosition(systemTile.getPosition());
        this._activatingPlayerSlot = player.getSlot();
        assert(this._activeSystem);
        assert(this._activeHex);
        assert(this._activatingPlayerSlot >= 0);

        this._ui.resetAfterSystemActivation(this._activeSystem);
    }

    roll(rollType, planet, player) {
        assert(typeof rollType === "string");
        assert(!planet || planet instanceof Planet);
        assert(player instanceof Player);

        if (!this._activeHex) {
            Broadcast.broadcastAll(locale("ui.error.no_active_system"));
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
        const planetLocaleName = planet ? planet.localeName : false;

        // Defending player gets nebula defense!
        const extraPlayer1Modifiers = [];
        const isNebula = this._activeSystem.anomalies.includes("nebula");
        const player1IsDefender = playerSlot1 !== this._activatingPlayerSlot;
        if (isNebula && player1IsDefender) {
            const nebulaDefense = UnitModifier.getNsidUnitModifier(
                "token:base/nebula_defense"
            );
            assert(nebulaDefense);
            extraPlayer1Modifiers.push(nebulaDefense);
        }

        const auxDataPair = new AuxDataPair(
            playerSlot1,
            playerSlot2,
            this._activeHex,
            planetLocaleName,
            extraPlayer1Modifiers
        );
        const [aux1, aux2] = auxDataPair.getPairSync();
        assert(aux1 && aux2);

        // COMBAT TIME!!
        const combatRoller = new CombatRoller(aux1, rollType, player);
        const dicePos = new Vector(0, 0, world.getTableHeight());
        combatRoller.roll(dicePos);
    }
}

refObject.onCreated.add((obj) => {
    new AutoRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AutoRoller(refObject);
}
