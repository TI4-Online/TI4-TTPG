const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { TableLayout } = require("../../table/table-layout");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    HorizontalBox,
    LayoutBox,
    Rotator,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    world,
} = require("../../wrapper/api");

let _currentUI = undefined;

class HomebrewLoaderUi {
    constructor(homebrewLoader) {
        this._homebrewLoader = homebrewLoader;
    }

    createAndAddUI() {
        if (_currentUI) {
            world.removeUIElement(_currentUI);
            _currentUI = undefined;
        }

        const anchor = TableLayout.anchor.gameUI;

        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);
        const box = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setOverrideWidth(anchor.width * CONFIG.scale)
            .setChild(panel);
        const border = new Border()
            .setColor(CONFIG.backgroundColor)
            .setChild(box);
        const b = CONFIG.spacing / 2;
        const boxOuter = new LayoutBox()
            .setPadding(b, b, b, b)
            .setChild(border);
        const borderOuter = new Border()
            .setColor(CONFIG.spacerColor)
            .setChild(boxOuter);

        const header = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("homebrew.how_to"));
        panel.addChild(header);
        panel.addChild(new Border().setColor(CONFIG.spacerColor));

        let entries = this._homebrewLoader.getEntries();
        entries = entries.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        });
        for (const entry of entries) {
            const isActive = this._homebrewLoader.getActive(entry.id);
            const checkBox = new CheckBox()
                .setFontSize(CONFIG.fontSize)
                .setIsChecked(isActive)
                .setText(entry.name);
            //.setEnabled(!isActive); // cannot uncheck after adding
            checkBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
                this._homebrewLoader.setActive(entry.id, isChecked);
            });
            panel.addChild(checkBox);
        }

        const cancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel").toUpperCase());
        const buttonPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(cancelButton, 1);
        panel.addChild(buttonPanel);

        const pos = TableLayout.anchorPositionToWorld(
            anchor,
            new Vector(-20, 0, 0)
        );
        pos.z = world.getTableHeight() + 5;
        const ui = new UIElement();
        ui.anchorY = 0;
        ui.position = pos;
        ui.rotation = new Rotator(0, anchor.yaw, 0);
        ui.scale = 1 / CONFIG.scale;
        ui.widget = borderOuter;
        ui.useWidgetSize = true;

        world.addUI(ui);
        _currentUI = undefined;

        const doClose = () => {
            world.removeUIElement(ui);
            _currentUI = undefined;
            globalEvents.TI4.onGameSetup.remove(doClose);
        };
        globalEvents.TI4.onGameSetup.add(doClose);
        cancelButton.onClicked.add(doClose);
    }
}

module.exports = { HomebrewLoaderUi };
