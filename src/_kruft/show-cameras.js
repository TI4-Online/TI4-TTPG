const assert = require("../../wrapper/assert-wrapper");
const { WidgetFactory } = require("../ui/widget-factory");
const {
    Player,
    PlayerPermission,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

let _instance = undefined;

/**
 * Display seated players' camera locations in the world.
 * Only the streamer can see them.
 */
class ShowCameras {
    static getInstance() {
        if (!_instance) {
            _instance = new ShowCameras();
        }
        return _instance;
    }

    static _getFrozenObject(savedData) {
        const pos = new Vector(0, 0, 0);
        const rot = new Rotator(0, 0, 0);

        // See if already exists in world.
        for (const obj of world.getAllObjects()) {
            if (obj.getSavedData() === savedData) {
                obj.setPosition(pos); // reset pos/rot paranoia
                obj.setRotation(rot);
                obj.freeze();
                return obj;
            }
        }

        // Spawn if missing.
        const templateId = "83FDE12C4E6D912B16B85E9A00422F43"; // cube
        const obj = world.createObjectFromTemplate(templateId, pos);
        obj.setRotation(rot, 0);
        obj.setSavedData(savedData);
        obj.freeze();
        return obj;
    }

    static _createCameraUI(playerDesk, uiIndex) {
        const tint = playerDesk.plasticColor.clone();
        //tint.a = 0.6;
        const widget = WidgetFactory.imageWidget()
            //.setImage("global/ui/tiles/blank.png", refPackageId)
            .setImage("global/ui/hex_highlight_notched.png", refPackageId)
            .setTintColor(tint);
        const ui = WidgetFactory.uiElement();
        //ui.useTransparency = true;
        ui.widget = widget;
        return ui;
    }

    /**
     * Place the UI where the player is looking.
     */
    static _positionViewTarget(player, uiElement) {
        assert(player instanceof Player);
        assert(uiElement instanceof UIElement);

        const cameraPos = player.getPosition();
        const cameraDir = player.getRotation();
        const cameraForward = cameraDir.getForwardVector();

        const cameraUp = cameraDir.getUpVector();
        const fovLeft = cameraForward.rotateAngleAxis(-30, cameraUp);

        // Line-plane intersection.
        const planeNormal = new Vector(0, 0, 1);
        const planePos = new Vector(0, 0, world.getTableHeight());
        const diff = cameraPos.subtract(planePos);
        const prod1 = diff.dot(planeNormal);
        const intersect = (dir) => {
            const prod2 = dir.dot(planeNormal);
            const prod3 = prod2 !== 0 ? prod1 / prod2 : 0;
            const pos = cameraPos.subtract(dir.multiply(prod3));
            return pos;
        };

        // Get where gaze intersects table, and off-center one for field of view.
        const forwardPos = intersect(cameraForward);
        const fovLeftPos = intersect(fovLeft);
        const r = fovLeftPos.subtract(forwardPos).magnitude() * 20;

        uiElement.position = forwardPos.add([0, 0, 4]);
        //uiElement.rotation = new Rotator(0, player.getRotation().yaw, 0);
        uiElement.widget.setImageSize(r, r);
    }

    constructor() {
        this._playerSlotToUIs = {};
        this._viewers = [];
        this._active = false;

        this._tick = 0;
        this._uiIndex = 0;

        this._updateHandler = () => {
            this._update();
        };

        // Adding/removing/updating UI on an object flashes it invisible for a moment.
        // Use two objects with staggered updates to conceal the flashing.
        this._frozenObjects = [
            ShowCameras._getFrozenObject("__ShowCameras:0__"),
            ShowCameras._getFrozenObject("__ShowCameras:1__"),
        ];

        // Likewise create two UIs for juggling.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            this._playerSlotToUIs[playerSlot] = [
                ShowCameras._createCameraUI(playerDesk, 0),
                ShowCameras._createCameraUI(playerDesk, 1),
            ];
        }
    }

    addViewer(player) {
        assert(player instanceof Player);

        const playerSlot = player.getSlot();

        // Limit access: deny seated players, and for now only allow host.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            if (playerDesk.playerSlot === playerSlot) {
                console.log("ShowCameras.addViewer: rejecting seated player");
                return this;
            }
        }
        if (!player.isHost()) {
            console.log("ShowCameras.addViewer: rejecting non-host");
            return this;
        }

        if (!this._viewers.includes(playerSlot)) {
            this._viewers.push(playerSlot);
        }
        for (const uis of Object.values(this._playerSlotToUIs)) {
            for (const ui of uis) {
                ui.players = new PlayerPermission().setPlayerSlots(
                    this._viewers
                );
            }
        }
        return this;
    }

    toggle() {
        if (this._active) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        console.log("ShowCameras.start");

        if (this._viewers.length === 0) {
            console.log("ShowCameras.start: no viewers, aborting");
            return this;
        }

        this._active = true;

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const uis = this._playerSlotToUIs[playerSlot];
            this._frozenObjects[0].addUI(uis[0]);
            this._frozenObjects[1].addUI(uis[1]);
            uis[0].widget.setVisible(false);
            uis[1].widget.setVisible(false);
        }

        // Set positions immediately.
        this._update();

        globalEvents.onTick.remove(this._updateHandler);
        globalEvents.onTick.add(this._updateHandler);
        return this;
    }

    stop() {
        console.log("ShowCameras.stop");
        this._active = false;

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const uis = this._playerSlotToUIs[playerSlot];
            this._frozenObjects[0].removeUIElement(uis[0]);
            this._frozenObjects[1].removeUIElement(uis[1]);
        }

        globalEvents.onTick.remove(this._updateHandler);
        return this;
    }

    _update() {
        this._tick = (this._tick || 0) + 1;
        if (this._tick % 3 !== 0) {
            return;
        }

        const outgoingIndex = this._uiIndex;
        const outgoingObj = this._frozenObjects[outgoingIndex];
        const outgoingUIs = [];

        this._uiIndex = (this._uiIndex + 1) % 2;

        const incomingIndex = this._uiIndex;
        const incomingObj = this._frozenObjects[incomingIndex];
        const incomingUIs = [];

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const uis = this._playerSlotToUIs[playerSlot];

            const outgoingUi = uis[outgoingIndex];
            outgoingUIs.push(outgoingUi);

            // Only show for valid players.
            const player = world.getPlayerBySlot(playerDesk.playerSlot);
            if (player && player.isValid()) {
                const incomingUi = uis[incomingIndex];
                ShowCameras._positionViewTarget(player, incomingUi);
                incomingUIs.push(incomingUi);
            }
        }

        // Show incoming UIs.
        for (const incomingUi of incomingUIs) {
            incomingUi.widget.setVisible(true);
            incomingObj.updateUI(incomingUi);
        }

        // It takes a moment before it appears.
        let waitFrames = 3;
        const delayedHide = () => {
            if (waitFrames > 0) {
                waitFrames -= 1;
                process.nextTick(delayedHide);
                return;
            }
            for (const outgoingUi of outgoingUIs) {
                outgoingUi.widget.setVisible(false);
                outgoingObj.updateUI(outgoingUi);
            }
        };
        delayedHide();
    }
}

module.exports = { ShowCameras };
