const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRollerUI } = require("./auto-roller-ui");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { Broadcast } = require("../../lib/broadcast");
const { CollapsiblePanel } = require("../../lib/ui/collapsible-panel");
const { CombatRoller } = require("../../lib/combat/combat-roller");
const { Hex } = require("../../lib/hex");
const { Planet } = require("../../lib/system/system");

const {
    GameObject,
    Player,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

/**
 * Add this script to a TTPG object to create the auto-roller.
 */
class AutoRoller {
    constructor(gameObject) {
        assert(!gameObject || gameObject instanceof GameObject);
        this._activeSystem = false;
        this._activeHex = false;
        this._activatingPlayerSlot = -1;
        this._firstBombardmentPlanet = false;
        this._playerSlotToDice = {};

        this._ui = new AutoRollerUI((rollType, planet, player) => {
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
        if (gameObject) {
            gameObject.onDestroyed.add((obj) => {
                globalEvents.TI4.onSystemActivated.remove(handler);
            });
        }

        // Attach UI if given an object.
        if (gameObject) {
            const uiElement = new UIElement();
            uiElement.position = new Vector(0, 0, 5);
            uiElement.widget = new CollapsiblePanel().setChild(this._ui);
            uiElement.anchorY = 0;
            gameObject.addUI(uiElement);
            this._ui.setOwningObjectForUpdate(gameObject, uiElement);
        }
    }

    getUI() {
        return this._ui;
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

        const isEndTurn = rollType === "endTurn";
        if (isEndTurn) {
            world.TI4.turns.endTurn(player.getSlot(), player);
            return;
        }

        const isFinMove = rollType === "finishMove";
        if (isFinMove) {
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                player.getSlot()
            );
            const color = playerDesk ? playerDesk.color : undefined;

            Broadcast.broadcastAll(
                locale("ui.message.finalize_movement", {
                    playerName: player.getName(),
                }),
                color
            );
            return;
        }

        const isAnnounceRetreat = rollType === "announceRetreat";
        if (isAnnounceRetreat) {
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                player.getSlot()
            );
            const color = playerDesk ? playerDesk.color : undefined;

            Broadcast.broadcastAll(
                locale("ui.message.announce_retreat", {
                    playerName: player.getName(),
                }),
                color
            );
            return;
        }

        const isProduction = rollType === "production";
        if (isProduction) {
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                player.getSlot()
            );
            const color = playerDesk ? playerDesk.color : undefined;

            Broadcast.broadcastAll(
                locale("ui.message.production", {
                    playerName: player.getName(),
                    systemTile: this._activeSystem.tile,
                    systemName: this._activeSystem.getSummaryStr(),
                }),
                color
            );
            return;
        }

        const isReportModifiers = rollType === "reportModifiers";

        if (!this._activeHex && !isReportModifiers) {
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

        const auxDataPair = new AuxDataPair(aux1, aux2);
        if (isReportModifiers) {
            auxDataPair.disableModifierFiltering();
        }
        auxDataPair.fillPairSync();

        if (isReportModifiers) {
            const unitModifiers = aux1.unitModifiers;
            const report = CombatRoller.getModifiersReport(unitModifiers, true);
            Broadcast.chatAll(report, this._color);
            return;
        }

        const playerSlot = player.getSlot();
        let dicePos = new Vector(20, -60, world.getTableHeight());
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            dicePos = playerDesk.center.add([0, 0, 10]);
        }

        // Destroy any old dice.
        let dice = this._playerSlotToDice[playerSlot];
        if (dice) {
            for (const die of dice) {
                die.destroy();
            }
        }

        // COMBAT TIME!!
        const combatRoller = new CombatRoller(aux1, rollType, player);
        dice = combatRoller.roll(dicePos);
        this._playerSlotToDice[playerSlot] = dice;
    }
}

module.exports = { AutoRoller };
