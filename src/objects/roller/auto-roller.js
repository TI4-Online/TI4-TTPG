const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRollerUI } = require("./auto-roller-ui");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { Broadcast } = require("../../lib/broadcast");
const { CombatRoller } = require("../../lib/combat/combat-roller");
const { Hex } = require("../../lib/hex");
const { Planet } = require("../../lib/system/system");

const {
    GameObject,
    Player,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");

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
        this._firstBombardmentPlanet = false;

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

        this._activeSystem = world.TI4.getSystemBySystemTileObject(systemTile);
        this._activeHex = Hex.fromPosition(systemTile.getPosition());
        this._activatingPlayerSlot = player.getSlot();
        this._firstBombardmentPlanet = false;
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

        // All space cannon rolls are spaceCannon.  Leave open the door to
        // specify which type (defense can be inferred by active planet).
        if (
            rollType === "spaceCannonOffense" ||
            rollType === "spaceCannonDefense"
        ) {
            rollType = "spaceCannon";
        }

        if (
            rollType === "bombardment" &&
            planet &&
            !this._firstBombardmentPlanet
        ) {
            this._firstBombardmentPlanet = planet;
        }
        const isFirstBombardmentPlanet =
            this._firstBombardmentPlanet === planet;

        // Build self.
        let faction = world.TI4.getFactionByPlayerSlot(player.getSlot());
        const aux1 = new AuxDataBuilder()
            .setPlayerSlot(player.getSlot())
            .setFaction(faction)
            .setHex(this._activeHex)
            .setActivatingPlayerSlot(this._activatingPlayerSlot)
            .setActiveSystem(this._activeSystem)
            .setActivePlanet(planet)
            .setRollType(rollType)
            .setIsFirstBombardmentPlanet(isFirstBombardmentPlanet)
            .build();

        // Build opponent.
        let opponentPlayerSlot;
        if (player.getSlot() === this._activatingPlayerSlot) {
            // Active player clicked.  Set opponent to -1 to figure it out.
            opponentPlayerSlot = -1;
        } else {
            // Not-active player clicked, opponent is always active player.
            opponentPlayerSlot = this._activatingPlayerSlot;
        }
        faction = world.TI4.getFactionByPlayerSlot(opponentPlayerSlot);
        const aux2 = new AuxDataBuilder()
            .setPlayerSlot(opponentPlayerSlot)
            .setFaction(faction)
            .setHex(this._activeHex)
            .setActivatingPlayerSlot(this._activatingPlayerSlot)
            .setActiveSystem(this._activeSystem)
            .setActivePlanet(planet)
            .setRollType(rollType)
            .build();

        new AuxDataPair(aux1, aux2).fillPairSync();

        // COMBAT TIME!!
        const combatRoller = new CombatRoller(aux1, rollType, player);
        const dicePos = new Vector(20, -60, world.getTableHeight());
        combatRoller.roll(dicePos);
    }
}

refObject.onCreated.add((obj) => {
    new AutoRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AutoRoller(refObject);
}
