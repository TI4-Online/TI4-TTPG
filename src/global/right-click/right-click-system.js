const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { CommandToken } = require("../../lib/command-token/command-token");
const { Explore } = require("../../lib/explore/explore");
const {
    Border,
    Button,
    GameObject,
    ImageButton,
    Rotator,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");

let _openPopupObj = false;
let _openPopupUi = false;

function _closePopup() {
    if (_openPopupObj) {
        _openPopupObj.removeUIElement(_openPopupUi);
        _openPopupObj = false;
        _openPopupUi = false;
    }
}

function addRightClickOptions(systemTileObj) {
    assert(systemTileObj instanceof GameObject);

    // Skip home system placeholders and hyperlanes.
    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    if (!system || system.hyperlane) {
        return;
    }

    const getNamesAndActions = () => {
        const namesAndActions = [
            {
                name: locale("ui.action.system.activate"),
                action: (player) => {
                    _closePopup();
                    CommandToken.activateSystem(systemTileObj, player);
                },
            },
            {
                // This could be disabled for empty systems (diplomcay rider
                // makes it legal for Mecatol).
                name: locale("ui.action.system.diplomacy"),
                action: (player) => {
                    _closePopup();
                    CommandToken.diplomacySystem(systemTileObj, player);
                },
            },
        ];

        const exploreNamesAndActions =
            Explore.getExploreActionNamesAndActions(systemTileObj);
        for (const nameAndAction of exploreNamesAndActions) {
            namesAndActions.push({
                name: nameAndAction.name,
                action: (player) => {
                    _closePopup();
                    nameAndAction.action(player);
                },
            });
        }
        return namesAndActions;
    };

    // Add as right-click options.  Not ideal because ground mode.
    // Might want to reset after adding mirage?
    const namesAndActions = getNamesAndActions();
    for (const nameAndAction of namesAndActions) {
        systemTileObj.addCustomAction("*" + nameAndAction.name);
    }
    systemTileObj.onCustomAction.add((obj, player, actionName) => {
        for (const nameAndAction of namesAndActions) {
            if ("*" + nameAndAction.name === actionName) {
                nameAndAction.action(player);
                break;
            }
        }
    });

    // Also offer via a button.  Image buttons are quite blurry especially
    // when small.  Make a big one and scale it down.
    const button = new ImageButton()
        .setImage("global/ui/menu_button_hex.png", refPackageId)
        .setImageSize(100, 150);

    // Mallice needs to be flipped to see button, that's ok.
    const ui = new UIElement();
    ui.widget = button;
    ui.position = new Vector(0, 4.7, 0.2);
    ui.scale = 0.1;
    ui.useTransparency = true;
    systemTileObj.addUI(ui);

    button.onClicked.add((button, player) => {
        _closePopup();
        const popupPanel = new VerticalBox();
        const popupUi = new UIElement();
        popupUi.widget = new Border().setChild(popupPanel);
        popupUi.rotation = systemTileObj.worldRotationToLocal(
            new Rotator(0, 0, 0)
        );
        popupUi.position = ui.position.add([0, 0, 3]);

        const namesAndActions = getNamesAndActions();
        for (const nameAndAction of namesAndActions) {
            const button = new Button().setText(nameAndAction.name);
            button.onClicked.add((button, player) => {
                _closePopup();
                nameAndAction.action(player);
            });
            popupPanel.addChild(button);
        }

        const closeButton = new Button().setText(locale("ui.button.cancel"));
        closeButton.onClicked.add((button, player) => {
            _closePopup();
        });
        popupPanel.addChild(closeButton);

        systemTileObj.addUI(popupUi);
        _openPopupObj = systemTileObj;
        _openPopupUi = popupUi;
    });
}

globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isSystemTile(obj)) {
        addRightClickOptions(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isSystemTile(obj)) {
            addRightClickOptions(obj);
        }
    }
}
