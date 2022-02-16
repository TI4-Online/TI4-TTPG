const locale = require("../lib/locale");
const { Faction } = require("./faction/faction");
const {
    SetupFactionAlliance,
} = require("../setup/faction/setup-faction-alliance");
const { SetupFactionExtra } = require("../setup/faction/setup-faction-extra");
const {
    SetupFactionLeaders,
} = require("../setup/faction/setup-faction-leaders");
const {
    SetupFactionPromissory,
} = require("../setup/faction/setup-faction-promissory");
const { SetupFactionSheet } = require("../setup/faction/setup-faction-sheet");
const { SetupFactionTech } = require("../setup/faction/setup-faction-tech");
const { SetupFactionTokens } = require("../setup/faction/setup-faction-tokens");
const { SetupHomeSystem } = require("../setup/faction/setup-home-system");
const { SetupGenericPromissory } = require("../setup/setup-generic-promissory");
const { SetupGenericTech } = require("../setup/setup-generic-tech");
const { SetupSheets } = require("../setup/setup-sheets");
const { SetupSupplyBoxes } = require("../setup/setup-supply-boxes");
const { SetupUnits } = require("../setup/setup-units");
const { Border, Button, UIElement, VerticalBox } = require("../wrapper/api");

const DESK_UI_POSITION = {
    pos: { x: 25, y: -6, z: 10 },
};
const LARGE_FONT_SIZE = 50;

/**
 * Do not require this in player-desk.js,
 */
class PlayerDeskUI {
    constructor(playerDesk) {
        this._playerDesk = playerDesk;
    }

    create() {
        const panel = new VerticalBox()
            .setChildDistance(5)
            .addChild(this._createTakeSetButton())
            .addChild(this._createCleanButton())
            .addChild(this._createSetupFactionButton())
            .addChild(this._createCleanFactionButton());

        const pos = this._playerDesk.localPositionToWorld(DESK_UI_POSITION.pos);
        pos.z = 10;

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = new Border().setChild(panel);

        return ui;
    }

    _createTakeSetButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.take_seat");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            this._playerDesk.seatPlayer(player);
        });
        return button;
    }

    _createCleanButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_seat");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = [
                new SetupGenericPromissory(this._playerDesk),
                new SetupGenericTech(this._playerDesk),
                new SetupUnits(this._playerDesk),
                new SetupSupplyBoxes(this._playerDesk),
                new SetupSheets(this._playerDesk),
            ];
            setups.forEach((setup) => setup.clean());
        });
        return button;
    }

    _createSetupFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.faction_setup");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const faction = Faction.getByNsidName("ul");
            const setups = [
                new SetupFactionAlliance(this._playerDesk, faction),
                new SetupFactionExtra(this._playerDesk, faction),
                new SetupFactionLeaders(this._playerDesk, faction),
                new SetupFactionPromissory(this._playerDesk, faction),
                new SetupFactionSheet(this._playerDesk, faction),
                new SetupFactionTech(this._playerDesk, faction),
                new SetupFactionTokens(this._playerDesk, faction),
                new SetupHomeSystem(this._playerDesk, faction),
            ];
            setups.forEach((setup) => setup.setup());
        });
        return button;
    }

    _createCleanFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.faction_clean");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const faction = Faction.getByNsidName("ul");
            const setups = [
                new SetupFactionAlliance(this._playerDesk, faction),
                new SetupFactionExtra(this._playerDesk, faction),
                new SetupFactionLeaders(this._playerDesk, faction),
                new SetupFactionPromissory(this._playerDesk, faction),
                new SetupFactionSheet(this._playerDesk, faction),
                new SetupFactionTech(this._playerDesk, faction),
                new SetupFactionTokens(this._playerDesk, faction),
                new SetupHomeSystem(this._playerDesk, faction),
            ];
            setups.forEach((setup) => setup.clean());
        });
        return button;
    }
}

module.exports = { PlayerDeskUI };
