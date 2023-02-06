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

        this._ui = new UIElement();
        this._ui.anchorY = 0;
        this._ui.position = playerDesk.localPositionToWorld(PICK_UI.pos);
        this._ui.rotation = playerDesk.rot;
        this._ui.scale = 1 / CONFIG.scale;
        this._ui.widget = this.getWidget();
        world.addUI(this._ui);
    }

    getWidget() {
        const chooseFactionUi = new ChooseFactionUi()
            .setNumCols(NUM_COLS)
            .setFitNameLength(FIT_NAME_LENGTH)
            .setButtonSize(BUTTON_WIDTH, BUTTON_HEIGHT);

        const chooseButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ok"))
            .setEnabled(false);
        chooseButton.onClicked.add((button, player) => {
            const faction = chooseFactionUi.getSelectedFactions()[0];
            if (faction) {
                this.onChooseFaction(faction);
            }
        });
        chooseFactionUi.onFactionStateChanged.add(() => {
            const selected = chooseFactionUi.getSelectedFactions();
            chooseButton.setEnabled(selected.length === 1);
        });

        const randomButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.random"));
        randomButton.onClicked.add((button, player) => {
            const factions = ChooseFactionUi.getOrderedFactions();
            const faction = factions[floor(Math.random() * factions.length)];
            chooseFactionUi.setIsSelected(faction, true);
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
            .addChild(chooseFactionUi.getWidget())
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

        world.removeUIElement(this._ui);
        this._playerDesk.resetUI();
    }

    onChooseFaction(faction) {
        assert(faction.nameAbbr);
        console.log(
            `PlayerDeskPickFaction.onChooseFaction ${this._playerDesk.colorName} "${faction.nsidName}"`
        );

        world.removeUIElement(this._ui);

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
