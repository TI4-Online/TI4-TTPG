const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { PlayerDeskSetup } = require("./player-desk-setup");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    VerticalBox,
    UIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { ChooseFactionUi } = require("../ui/choose-faction-ui");
const { floor } = require("lodash");

const PICK_UI = {
    pos: { x: 40, y: 0, z: 4 },
};
const BUTTON_WIDTH = 150 * CONFIG.scale;
const BUTTON_HEIGHT = 60 * CONFIG.scale;
const NUM_COLS = 4;
const FIT_NAME_LENGTH = 8;

class PlayerDeskPickFaction {
    constructor(playerDesk) {
        assert(playerDesk);

        this._playerDesk = playerDesk;
        this._chooseFactionUi = undefined;

        this._ui = new UIElement();
        this._ui.anchorY = 0;
        this._ui.position = playerDesk.localPositionToWorld(PICK_UI.pos);
        this._ui.rotation = playerDesk.rot;
        this._ui.scale = 1 / CONFIG.scale;
        this._ui.widget = this.getWidget();
        playerDesk.addUI(this._ui);

        this._onFactionChangedHandler = () => {
            if (this._chooseFactionUi) {
                this._chooseFactionUi.update();
            }
        };
        globalEvents.TI4.onFactionChanged.add(this._onFactionChangedHandler);
    }

    getWidget() {
        this._chooseFactionUi = new ChooseFactionUi()
            .setNumCols(NUM_COLS)
            .setFitNameLength(FIT_NAME_LENGTH)
            .setButtonSize(BUTTON_WIDTH, BUTTON_HEIGHT);

        const chooseButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ok"))
            .setEnabled(false);
        chooseButton.onClicked.add((button, player) => {
            const faction = this._chooseFactionUi.getSelectedFactions()[0];
            if (faction) {
                this.onChooseFaction(faction);
            }
        });
        this._chooseFactionUi.onFactionStateChanged.add(() => {
            const selected = this._chooseFactionUi.getSelectedFactions();
            chooseButton.setEnabled(selected.length === 1);
        });

        const randomButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.random"));
        randomButton.onClicked.add((button, player) => {
            const activeFactionNsids = new Set();
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const playerSlot = playerDesk.playerSlot;
                const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
                if (faction) {
                    activeFactionNsids.add(faction.nsidName);
                }
            }
            const factions = ChooseFactionUi.getOrderedFactions().filter(
                (faction) => {
                    return !activeFactionNsids.has(faction.nsidName);
                }
            );
            const faction = factions[floor(Math.random() * factions.length)];
            this._chooseFactionUi.setIsSelected(faction, true);
        });

        const cancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        cancelButton.onClicked.add((button, player) => {
            this.onCancel();
        });

        const bottomButtons = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(chooseButton, 1)
            .addChild(randomButton, 1)
            .addChild(cancelButton, 1);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._chooseFactionUi.getWidget())
            .addChild(bottomButtons);

        const pad = CONFIG.spacing;
        const box = new LayoutBox()
            .setPadding(pad, pad, pad, pad)
            .setChild(panel);

        const border = new Border()
            .setColor(CONFIG.backgroundColor)
            .setChild(box);
        return border;
    }

    onCancel() {
        console.log(
            `PlayerDeskPickFaction.onCancel ${this._playerDesk.colorName}`
        );

        globalEvents.TI4.onFactionChanged.remove(this._onFactionChangedHandler);
        this._playerDesk.removeUIElement(this._ui);
        this._playerDesk.resetUI();
    }

    onChooseFaction(faction) {
        assert(faction.nameAbbr);
        console.log(
            `PlayerDeskPickFaction.onChooseFaction ${this._playerDesk.colorName} "${faction.nsidName}"`
        );

        globalEvents.TI4.onFactionChanged.remove(this._onFactionChangedHandler);
        this._playerDesk.removeUIElement(this._ui);

        this._playerDesk._factionSetupInProgress = true;
        const onFinished = () => {
            this._playerDesk._factionSetupInProgress = false;
            this._playerDesk.resetUI();
        };
        new PlayerDeskSetup(this._playerDesk).setupFactionAsync(
            faction.nsidName,
            onFinished
        );
        this._playerDesk.resetUI();
    }
}

module.exports = { PlayerDeskPickFaction };
