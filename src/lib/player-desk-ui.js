const locale = require("../lib/locale");
const { Faction } = require("./faction/faction");

const { SetupGenericPromissory } = require("../setup/setup-generic-promissory");
const { SetupGenericTech } = require("../setup/setup-generic-tech");
const { SetupSheets } = require("../setup/setup-sheets");
const { SetupSupplyBoxes } = require("../setup/setup-supply-boxes");
const { SetupUnits } = require("../setup/setup-units");

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
const { SetupStartingTech } = require("../setup/faction/setup-starting-tech");
const { SetupStartingUnits } = require("../setup/faction/setup-starting-units");

const {
    Border,
    Button,
    UIElement,
    VerticalBox,
    globalEvents,
    world,
} = require("../wrapper/api");
const { ObjectNamespace } = require("./object-namespace");

const DESK_UI_POSITION = {
    pos: { x: 25, y: -6, z: 5 },
};
const LARGE_FONT_SIZE = 30;

/**
 * Do not require this in player-desk.js,
 */
class PlayerDeskUI {
    constructor(playerDesk) {
        this._playerDesk = playerDesk;
    }

    create() {
        const playerSlot = this._playerDesk.playerSlot;

        const panel = new VerticalBox().setChildDistance(5);

        if (!world.getPlayerBySlot(playerSlot)) {
            panel.addChild(this._createTakeSeatButton());
        }

        let isSetup = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "sheet:base/command") {
                isSetup = true;
                break;
            }
        }
        if (isSetup) {
            panel.addChild(this._createCleanButton());
        } else {
            panel.addChild(this._createSetupButton());
        }

        if (Faction.getByPlayerSlot(playerSlot)) {
            panel.addChild(this._createCleanFactionButton());
        } else {
            panel.addChild(this._createSetupFactionButton());
        }

        const pos = this._playerDesk.localPositionToWorld(DESK_UI_POSITION.pos);
        pos.z = world.getTableHeight() + 0.5;

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = new Border().setChild(panel);

        return ui;
    }

    _createTakeSeatButton() {
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

    _createSetupButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.setup_desk");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = this._getGenericSetups();
            setups.forEach((setup) => setup.setup());
            this._playerDesk.resetUI();
        });
        return button;
    }

    _createCleanButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_desk");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = this._getGenericSetups();
            setups.forEach((setup) => setup.clean());
            this._playerDesk.resetUI();
        });
        return button;
    }

    _createSetupFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.setup_faction");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = this._getFactionSetups();
            setups.forEach((setup) => setup.setup());
            const playerSlot = this._playerDesk.playerSlot;
            this._playerDesk.resetUI();
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
        });
        return button;
    }

    _createCleanFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_faction");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = this._getFactionSetups();
            setups.forEach((setup) => setup.clean());
            const playerSlot = this._playerDesk.playerSlot;
            this._playerDesk.resetUI();
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
        });
        return button;
    }

    _getGenericSetups() {
        return [
            new SetupGenericPromissory(this._playerDesk),
            new SetupGenericTech(this._playerDesk),
            new SetupUnits(this._playerDesk),
            new SetupSupplyBoxes(this._playerDesk),
            new SetupSheets(this._playerDesk),
        ];
    }

    _getFactionSetups() {
        const faction = Faction.getByNsidName("ul");
        return [
            new SetupFactionAlliance(this._playerDesk, faction),
            new SetupFactionExtra(this._playerDesk, faction),
            new SetupFactionLeaders(this._playerDesk, faction),
            new SetupFactionPromissory(this._playerDesk, faction),
            new SetupFactionSheet(this._playerDesk, faction),
            new SetupFactionTech(this._playerDesk, faction),
            new SetupFactionTokens(this._playerDesk, faction),
            new SetupHomeSystem(this._playerDesk, faction),
            new SetupStartingTech(this._playerDesk, faction),
            new SetupStartingUnits(this._playerDesk, faction),
        ];
    }
}

module.exports = { PlayerDeskUI };
