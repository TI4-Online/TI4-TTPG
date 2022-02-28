const { Explore } = require("../lib/explore/explore");
const {
    Button,
    ImageButton,
    Rotator,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    world,
} = require("../wrapper/api");

let _openPopupObj = false;
let _openPopupUi = false;

function addRightClickOptions(systemTileObj) {
    const getNamesAndActions = () => {
        const namesAndActions = [];
        namesAndActions.push(
            ...Explore.getExploreActionNamesAndActions(systemTileObj)
        );
        return namesAndActions;
    };

    // Add as right-click options.  Not ideal because ground mode.
    // Might want to reset after adding mirage?
    const namesAndActions = getNamesAndActions();
    for (const nameAndAction of namesAndActions) {
        systemTileObj.addCustomAction(nameAndAction.name);
    }
    systemTileObj.onCustomAction.add((obj, player, actionName) => {
        for (const nameAndAction of namesAndActions) {
            if (nameAndAction.name === actionName) {
                nameAndAction.action(player);
                break;
            }
        }
    });

    // Also offer via a button.
    const button = new ImageButton()
        .setImage("global/technology/warfare_tech_icon.png")
        .setImageSize(5, 0);

    const ui = new UIElement();
    ui.widget = button;
    ui.position = new Vector(0, 4.7, 0.2);
    systemTileObj.addUI(ui);

    button.onClicked.add((button, player) => {
        if (_openPopupObj) {
            _openPopupObj.removeUIElement(_openPopupUi);
        }

        const popupPanel = new VerticalBox();
        const popupUi = new UIElement();
        popupUi.widget = popupPanel;
        popupUi.rotation = systemTileObj.worldRotationToLocal(
            new Rotator(0, 0, 0)
        );
        popupUi.position = ui.position.add([0, 0, 2]);

        const closeButton = new Button().setText("<close>");
        closeButton.onClicked.add(systemTileObj.removeUIElement(popupUi));
        popupPanel.addChild(closeButton);

        systemTileObj.addUI(popupUi);
        _openPopupObj = systemTileObj;
        _openPopupUi = popupUi;
    });
}

globalEvents.onObjectCreated.add((obj) => {
    if (world.TI4.getSystemBySystemTileObject(obj)) {
        addRightClickOptions(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.TI4.getAllSystemTileObjects()) {
        addRightClickOptions(obj);
    }
}
