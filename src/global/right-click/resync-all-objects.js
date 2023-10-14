/**
 * Force update all objects (e.g. one player not seeing things in correct location).
 */
const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Border,
    Card,
    Container,
    Dice,
    LayoutBox,
    Player,
    ProgressBar,
    ScreenUIElement,
    Text,
    VerticalBox,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");

const PROCESS_N_PER_INTERVAL = 50;

class ResyncAllObjects {
    constructor() {
        this._objIds = undefined;
        this._total = undefined;
        this._ui = undefined;
        this._progressBar = undefined;
    }

    showUI() {
        if (this._ui) {
            world.removeScreenUIElement(this._ui);
            this._ui = undefined;
        }

        const label = new Text().setText("Resyncing objects");
        this._progressBar = new ProgressBar();

        const panel = new VerticalBox()
            .setChildDistance(10)
            .addChild(label)
            .addChild(this._progressBar);

        const box = new LayoutBox().setPadding(10, 10, 10, 0).setChild(panel);
        const border = new Border().setChild(box);

        this._ui = new ScreenUIElement();
        this._ui.anchorX = 0.5;
        this._ui.anchorY = 0.5;
        this._ui.positionX = 0.5;
        this._ui.positionY = 0.5;
        this._ui.relativePositionX = true;
        this._ui.relativePositionY = true;
        this._ui.height = 100;
        this._ui.width = 500;
        this._ui.widget = border;

        world.addScreenUI(this._ui);
    }

    hideUI() {
        if (this._ui) {
            world.removeScreenUIElement(this._ui);
            this._ui = undefined;
        }
    }

    updateUI() {
        const value = 1 - this._objIds.length / Math.max(this._total, 1);
        this._progressBar.setProgress(value);
    }

    start(player) {
        assert(player instanceof Player);
        Broadcast.chatAll(
            `ResyncAllObjects triggered by ${player.getName()}`,
            Broadcast.ERROR
        );

        const skipContained = true;
        this._objIds = world
            .getAllObjects(skipContained)
            .filter((obj) => {
                if (
                    obj instanceof Card &&
                    (obj.isInHand() || obj.isInHolder())
                ) {
                    return false; // ignore cards in holders
                }
                if (obj instanceof Container) {
                    return false; // ignore containers
                }
                if (obj instanceof Dice) {
                    return false; // ignore dice
                }
                return true;
            })
            .map((obj) => {
                return obj.getId();
            });
        this._total = this._objIds.length;

        // Spread out resync over a second, potentially run longer if many many objects.
        const processN = Math.min(
            Math.floor(this._total / 10),
            PROCESS_N_PER_INTERVAL
        );
        console.log(
            `ResyncAllObjects.start: ${this._total}, updating ${processN} per interval`
        );

        this.showUI();
        const processSome = () => {
            // Process.
            const limit = Math.min(this._objIds.length, processN);
            for (let i = 0; i < limit; i++) {
                const id = this._objIds.pop();
                const obj = world.getObjectById(id);
                if (obj && obj.isValid()) {
                    ResyncAllObjects.resyncObject(obj);
                }
            }

            this.updateUI();

            // Schedule next process, or stop and hide UI.
            if (this._objIds.length > 0) {
                setTimeout(processSome, 100);
            } else {
                this.hideUI();
                this._objIds = undefined;
            }
        };
        processSome();
    }

    static resyncObject(obj) {
        // Recheck some state that might change.
        if (obj.isHeld()) {
            return false;
        }
        if (obj instanceof Card && (obj.isInHand() || obj.isInHolder())) {
            return false; // ignore cards in holders
        }

        const json = obj.toJSONString();
        const pos = obj.getPosition();
        const rot = obj.getRotation();

        obj.setTags(["DELETED_ITEMS_IGNORE"]);
        obj.destroy();

        // Creates either static object or game object.
        const clone = world.createStaticObjectFromJSON(json, pos);
        clone.setRotation(rot);

        return true;
    }
}

const actionName = "*" + locale("ui.menu.resync_all_objects");
world.addCustomAction(actionName);
globalEvents.onCustomAction.add((player, id) => {
    if (id === actionName) {
        new ResyncAllObjects().start(player);
    }
});
