const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { TableLayout } = require("../../table/table-layout");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    LayoutBox,
    Rotator,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { TabbedPanel } = require("../ui/tabbed-panel");

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

        // Create frame for UI.
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
            .setMinimumHeight(200 * CONFIG.scale)
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

        // Create core UI.
        const tabbedPanel = new TabbedPanel();
        tabbedPanel.setGetInitialWidget(() => {
            return new Text()
                .setAutoWrap(true)
                .setFontSize(CONFIG.fontSize)
                .setText(locale("homebrew.how_to"));
        });

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
            assert(typeof entry.name === "string");
            assert(Array.isArray(entry.options));

            const getWidget = () => {
                const description = new Text()
                    .setAutoWrap(true)
                    .setFontSize(CONFIG.fontSize)
                    .setText(entry.description);
                const panel = new VerticalBox()
                    .setChildDistance(CONFIG.spacing)
                    .addChild(description);

                for (const option of entry.options) {
                    const isActive = this._homebrewLoader.getActive(option.id);
                    const checkBox = new CheckBox()
                        .setFontSize(CONFIG.fontSize)
                        .setIsChecked(isActive)
                        .setText(option.name);
                    checkBox.onCheckStateChanged.add(
                        (checkBox, player, isChecked) => {
                            this._homebrewLoader.setActive(
                                option.id,
                                isChecked
                            );
                        }
                    );
                    panel.addChild(checkBox);
                }
                return panel;
            };
            tabbedPanel.addEntry(entry.name, getWidget);

            /*
            const isActive = this._homebrewLoader.getActive(entry.id);
            const checkBox = new CheckBox()
                .setFontSize(CONFIG.fontSize)
                .setIsChecked(isActive)
                .setText(entry.name);
            checkBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
                this._homebrewLoader.setActive(entry.id, isChecked);
            });
            panel.addChild(checkBox);
            */
        }

        const closeButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ok").toUpperCase());
        panel.addChild(tabbedPanel.createWidget(), 1);
        panel.addChild(closeButton);

        const pos = TableLayout.anchorPositionToWorld(
            anchor,
            new Vector(-20, 0, 0)
        );
        pos.z = world.getTableHeight() + 5.1;
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
        closeButton.onClicked.add(doClose);
    }
}

module.exports = { HomebrewLoaderUi };
