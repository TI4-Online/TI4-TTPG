const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const CONFIG = require("../game-ui/game-ui-config");
const { Broadcast } = require("../lib/broadcast");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const {
    Border,
    Button,
    GameObject,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Player,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    refObject,
    refPackageId,
    world,
} = require("../wrapper/api");

class StatusPad {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._awayImages = [];
        this._passImages = [];

        // Give creator a frame to finish setting state.
        process.nextTick(() => {
            this._obj.addUI(this.createForwardUi());
            this._obj.addUI(this.createReverseUi());
            this.updateUi();
        });
    }

    getPass() {
        return ObjectSavedData.get(this._obj, "isPass", false);
    }

    setPass(value) {
        assert(typeof value === "boolean");
        ObjectSavedData.set(this._obj, "isPass", value);
        this.updateUi();
    }

    getAway() {
        return ObjectSavedData.get(this._obj, "isAway", false);
    }

    setAway(value) {
        assert(typeof value === "boolean");
        ObjectSavedData.set(this._obj, "isAway", value);
        this.updateUi();
    }

    getEliminated() {
        return ObjectSavedData.get(this._obj, "isEliminated", false);
    }

    setEliminated(value) {
        assert(typeof value === "boolean");
        ObjectSavedData.set(this._obj, "isEliminated", value);
        this.updateUi();
    }

    _onClickedAway(player) {
        assert(player instanceof Player);

        const newValue = !this.getAway();
        this.setAway(newValue);

        const playerSlot = this._obj.getOwningPlayerSlot();
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const localeMsg = newValue
            ? "ui.message.player_away"
            : "ui.message.player_here";
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const color = playerDesk
            ? playerDesk.chatColor
            : player.getPlayerColor();
        const msg = locale(localeMsg, { playerName });
        Broadcast.broadcastAll(msg, color);
    }

    _onClickedPass(player) {
        assert(player instanceof Player);

        const newValue = !this.getPass();
        this.setPass(newValue);

        const playerSlot = this._obj.getOwningPlayerSlot();
        if (newValue) {
            // Announce pass.
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            const color = playerDesk
                ? playerDesk.chatColor
                : player.getPlayerColor();
            const msg = locale("ui.message.player_pass", { playerName });
            Broadcast.broadcastAll(msg, color);

            // Since this was a player click, also end turn.
            const currentDesk = world.TI4.turns.getCurrentTurn();
            if (currentDesk === playerDesk) {
                world.TI4.turns.endTurn(player);
            }
        }

        // Tell any listeners.
        globalEvents.TI4.onTurnPassedChanged.trigger(playerSlot, player);
    }

    _onClickedEliminated(player) {
        assert(player instanceof Player);

        const newValue = !this.getEliminated();
        this.setEliminated(newValue);

        const playerSlot = this._obj.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        playerDesk.setEliminated(newValue);

        if (newValue) {
            // Announce pass.
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const color = playerDesk
                ? playerDesk.chatColor
                : player.getPlayerColor();
            const msg = locale("ui.message.player_eliminated", { playerName });
            Broadcast.broadcastAll(msg, color);

            // Since this was a player click, also end turn.
            const currentDesk = world.TI4.turns.getCurrentTurn();
            if (currentDesk === playerDesk) {
                world.TI4.turns.endTurn(player);
            }
        }

        // Tell any listeners.
        globalEvents.TI4.onTurnEliminatedChanged.trigger(playerSlot, player);
    }

    /**
     * Create forward-facing UI, the semi-transparent afk/passed indicators.
     *
     * @returns {UIElement}
     */
    createForwardUi() {
        const imageSize = 150;
        const imageAway = new ImageWidget().setImageSize(imageSize);
        const imagePass = new ImageWidget().setImageSize(imageSize);

        this._awayImages.push(imageAway);
        this._passImages.push(imagePass);

        const panel = new HorizontalBox()
            .setChildDistance(10)
            .addChild(imagePass)
            .addChild(imageAway);

        const ui = new UIElement();
        ui.anchorY = 0;
        ui.position = new Vector(0, 0, 1.2);
        ui.rotation = new Rotator(15, 0, 0);
        ui.useTransparency = true;
        ui.scale = 0.2;
        ui.widget = panel;

        return ui;
    }

    /**
     * Create player-facting UI, buttons to toggle status.
     *
     * @returns {UIElement}
     */
    createReverseUi() {
        const fontSize = 28;
        const buttonAway = new Button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.away"));
        const buttonPass = new Button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.pass"));
        const buttonElim = new Button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.eliminated"));

        const applyEnabled = () => {
            const eliminated = this.getEliminated();
            buttonAway.setEnabled(!eliminated);
            buttonPass.setEnabled(!eliminated);
        };
        applyEnabled();

        buttonAway.onClicked.add((button, player) => {
            this._onClickedAway(player);
        });
        buttonPass.onClicked.add((button, player) => {
            this._onClickedPass(player);
        });
        buttonElim.onClicked.add((button, player) => {
            this._onClickedEliminated(player);
            applyEnabled();
        });

        const awayPassButtons = new HorizontalBox()
            .setChildDistance(10)
            .addChild(buttonAway, 1)
            .addChild(buttonPass, 1)
            .addChild(buttonElim, 1);

        const layoutBox = new LayoutBox()
            .setChild(awayPassButtons)
            .setMinimumHeight(150)
            .setMinimumWidth(450)
            .setPadding(10, 10, 10, 10);

        const ui = new UIElement();
        ui.anchorY = 0;
        ui.position = new Vector(0, 0, 0.29 + CONFIG.buttonLift);
        ui.rotation = new Rotator(0, 0, 180);
        ui.scale = 0.2;
        ui.widget = new Border().setChild(layoutBox);

        return ui;
    }

    updateUi() {
        const elimated = this.getEliminated();
        if (elimated) {
            const awayImgPath = "global/ui/panel_eliminated.png";
            for (const awayImage of this._awayImages) {
                awayImage.setImage(awayImgPath, refPackageId);
            }
            const passImgPath = "global/ui/panel_eliminated.png";
            for (const passImage of this._passImages) {
                passImage.setImage(passImgPath, refPackageId);
            }
            return;
        }

        const awayImgPath = this.getAway()
            ? "locale/ui/panel_away_on.png"
            : "locale/ui/panel_away_off.png";
        for (const awayImage of this._awayImages) {
            awayImage.setImage(awayImgPath, refPackageId);
        }

        const passImgPath = this.getPass()
            ? "locale/ui/panel_pass_on.png"
            : "locale/ui/panel_pass_off.png";
        for (const passImage of this._passImages) {
            passImage.setImage(passImgPath, refPackageId);
        }
    }
}

const statusPad = new StatusPad(refObject);
globalEvents.TI4.onTurnOrderEmpty.add((player) => {
    statusPad.setPass(false);
});
refObject.__getPass = () => {
    return statusPad.getPass();
};
refObject.__setPass = (value) => {
    statusPad.setPass(value);
};
