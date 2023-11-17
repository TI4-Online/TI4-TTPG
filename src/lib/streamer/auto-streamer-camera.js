/**
 * Move the camera to interesting places (activated system, agenda, etc)
 * for AFK streaming.
 */

const assert = require("../../wrapper/assert-wrapper");
const { FindTurnOrder } = require("../phase/find-turn-order");
const { ObjectNamespace } = require("../object-namespace");
const { TableLayout } = require("../../table/table-layout");
const {
    Border,
    Button,
    Player,
    PlayerPermission,
    ScreenUIElement,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

const LOOK_AT = {
    activeSystem: "activeSystem",
    gameUI: "gameUI",
    map: "map",
    score: "score",
};

const _activeAutoStreamerCameras = [];

class AutoStreamerCamera {
    static disconnectIfActive(player) {
        for (let i = 0; i < _activeAutoStreamerCameras.length; i++) {
            const entry = _activeAutoStreamerCameras[i];
            if (entry._player === player) {
                entry.disconnect();
                _activeAutoStreamerCameras.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    constructor(player) {
        assert(player instanceof Player);

        this._player = player;
        this._ui = undefined;

        this._scoring = false;
        this._systemActivation = false;
        this._warpIn = false;

        this._playerLeftHandler = () => {
            if (!this._player.isValid()) {
                AutoStreamerCamera.disconnectIfActive(this._player);
            }
        };

        this._onAgendaChanged = () => {
            this._scoring = false;
            this._systemActivation = false;
            this._warpIn = false;
            this.update();
        };
        this._onScored = (obj) => {
            // Watch for players scoring secrets during combat.
            // Simple solution: only listen for publics.
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("card.objective.secret")) {
                console.log("AutoStreamerCamera onScored: secret, ignoring");
                return;
            }

            console.log("AutoStreamerCamera onScored");
            this._scoring = true;
            this._systemActivation = false;
            this._warpIn = false;
            this.update();
        };
        this._onSystemActivated = () => {
            console.log("AutoStreamerCamera onSystemActivated");
            this._scoring = false;
            this._systemActivation = true;
            this._warpIn = false;
            this.update();
        };
        this._onTurnChanged = () => {
            // Watch for players ending turn during scoring.
            // Count the allocated strategy cards.
            const numPicked = FindTurnOrder.numPickedStrategyCards();
            if (numPicked <= 1) {
                console.log(
                    "AutoStreamerCamera onTurnChanged: too few picked strategy cards, ignoring"
                );
                return;
            }

            console.log("AutoStreamerCamera onTurnChanged");
            this._scoring = false;
            this._systemActivation = false;
            this._warpIn = false;
            this.update();
        };
        this._onTurnOrderChanged = () => {
            console.log("AutoStreamerCamera onTurnOrderChanged");
            this._scoring = false;
            this._systemActivation = false;
            this._warpIn = false;
            this.update();
        };
        this._onTurnOrderEmpty = () => {
            console.log("AutoStreamerCamera onTurnOrderEmpty");
            this._scoring = true;
            this._systemActivation = false;
            this._warpIn = false;
            this.update();
        };
        this._onWarpUnits = (warpIn, triggeredByOnTurnChangeEvent) => {
            if (triggeredByOnTurnChangeEvent) {
                console.log(
                    "AutoStreamerCamera onWarpUnits: triggered by turn change, ignoring"
                );
                return; // only react if triggered by warp button
            }
            console.log("AutoStreamerCamera onWarpUnits");
            this._scoring = false;
            this._systemActivation = true;
            this._warpIn = warpIn;
            this.update();
        };

        this.connect();

        // Limit one per player.
        AutoStreamerCamera.disconnectIfActive(player);
        _activeAutoStreamerCameras.push(this);
    }

    connect() {
        console.log(`AutoStreamerCamera.connect`);

        globalEvents.onPlayerLeft.add(this._playerLeftHandler);

        globalEvents.TI4.onAgendaChanged.add(this._onAgendaChanged);
        globalEvents.TI4.onScored.add(this._onScored);
        globalEvents.TI4.onSystemActivated.add(this._onSystemActivated);
        globalEvents.TI4.onTurnChanged.add(this._onTurnChanged);
        globalEvents.TI4.onTurnOrderChanged.add(this._onTurnOrderChanged);
        globalEvents.TI4.onTurnOrderEmpty.add(this._onTurnOrderEmpty);
        globalEvents.TI4.onWarpUnits.add(this._onWarpUnits);

        this.addUI();
    }

    disconnect() {
        console.log(`AutoStreamerCamera.disconnect`);

        globalEvents.onPlayerLeft.remove(this._playerLeftHandler);

        globalEvents.TI4.onAgendaChanged.remove(this._onAgendaChanged);
        globalEvents.TI4.onScored.remove(this._onScored);
        globalEvents.TI4.onSystemActivated.remove(this._onSystemActivated);
        globalEvents.TI4.onTurnChanged.remove(this._onTurnChanged);
        globalEvents.TI4.onTurnOrderChanged.remove(this._onTurnOrderChanged);
        globalEvents.TI4.onTurnOrderEmpty.remove(this._onTurnOrderEmpty);
        globalEvents.TI4.onWarpUnits.remove(this._onWarpUnits);

        this.removeUI();
    }

    addUI() {
        console.log(`AutoStreamerCamera.addUI`);

        if (this._ui) {
            world.removeScreenUIElement(this._ui);
            this._ui = undefined;
        }

        const button = new Button()
            .setFontSize(20)
            .setBold(true)
            .setText("Auto\nStreamer\nCamera");
        button.onClicked.add(() => {
            AutoStreamerCamera.disconnectIfActive(this._player);
        });

        const c = 0.5;
        const border = new Border().setColor([c, c, c, 1]).setChild(button);

        const playerPermission = new PlayerPermission();
        playerPermission.setPlayerSlots([this._player.getSlot()]);

        this._ui = new ScreenUIElement();
        this._ui.relativeHeight = false;
        this._ui.relativeWidth = false;
        this._ui.relativePositionX = true;
        this._ui.relativePositionY = true;
        this._ui.anchorX = 1;
        this._ui.anchorY = 1;
        this._ui.width = 200;
        this._ui.height = 200;
        this._ui.players = playerPermission;
        this._ui.positionX = 1;
        this._ui.positionY = 1;
        this._ui.widget = border;
        world.addScreenUI(this._ui);
    }

    removeUI() {
        console.log(`AutoStreamerCamera.removeUI`);
        if (this._ui) {
            world.removeScreenUIElement(this._ui);
            this._ui = undefined;
        }
    }

    getLookWhereTag() {
        const isAgenda = world.TI4.agenda.isActive();
        const isScoring = this._scoring;
        const isSystemActivation = this._systemActivation;
        const isWarpIn = this._warpIn;

        assert(typeof isAgenda === "boolean");
        assert(typeof isScoring === "boolean");
        assert(typeof isSystemActivation === "boolean");
        assert(typeof isWarpIn === "boolean");

        if (isAgenda) {
            const numPicked = FindTurnOrder.numPickedStrategyCards();
            if (numPicked <= 1) {
                return LOOK_AT.gameUI;
            }
        }

        if (isScoring) {
            return LOOK_AT.score;
        }

        if (isSystemActivation) {
            if (isWarpIn) {
                return LOOK_AT.gameUI;
            }
            return LOOK_AT.activeSystem;
        }

        return LOOK_AT.map;
    }

    whereTagToLookState(whereTag) {
        if (whereTag === LOOK_AT.activeSystem) {
            const systemTileObj = world.TI4.getActiveSystemTileObject();
            const pos = systemTileObj
                ? systemTileObj.getPosition()
                : new Vector(0, 0, 0);
            return { pos, yaw: 0, distance: 20 };
        } else if (whereTag === LOOK_AT.gameUI) {
            return {
                pos: TableLayout.anchor.gameUI.pos,
                yaw: TableLayout.anchor.gameUI.yaw,
                distance: 70,
            };
        } else if (whereTag === LOOK_AT.map) {
            return {
                pos: new Vector(0, 0, 0),
                yaw: 0,
                distance: 150,
            };
        } else if (whereTag === LOOK_AT.score) {
            return {
                pos: TableLayout.anchor.score.pos,
                yaw: TableLayout.anchor.score.yaw,
                distance: 50,
            };
        }
    }

    lookAt(where) {
        const { pos, yaw, distance } = where;
        assert(typeof pos.x === "number");
        assert(typeof pos.y === "number");
        assert(typeof pos.z === "number");
        assert(typeof yaw === "number");
        assert(typeof distance === "number");
        assert(this._player instanceof Player);

        assert(!Number.isNaN(pos.x));
        assert(!Number.isNaN(pos.y));
        assert(!Number.isNaN(pos.z));
        assert(!Number.isNaN(yaw));
        assert(!Number.isNaN(distance));

        if (!this._player.isValid()) {
            return;
        }

        const lookAt = new Vector(pos.x, pos.y, world.getTableHeight());
        const lookFrom = new Vector(-10, 0, world.getTableHeight() + distance)
            .rotateAngleAxis(yaw, [0, 0, 1])
            .add(lookAt);
        const rot = lookFrom.findLookAtRotation(lookAt);
        this._player.setPositionAndRotation(lookFrom, rot);
    }

    update() {
        // Be careful about moving the camera while holding an object.
        const agendaCard = world.TI4.agenda.getAgendaCard();
        if (agendaCard && this._player.getHeldObjects().includes(agendaCard)) {
            return;
        }

        const whereTag = this.getLookWhereTag();
        const whereState = this.whereTagToLookState(whereTag);
        console.log(`AutoStreamerCamera.update: "${whereTag}"`);
        this.lookAt(whereState);
    }
}

module.exports = { AutoStreamerCamera };
