const { Explore } = require("../lib/explore/explore");
const {
    ImageButton,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

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
    button.onClicked.add((button, player) => {
        // XXX TODO
        console.log("clicked");
    });

    const ui = new UIElement();
    ui.widget = button;
    ui.position = new Vector(0, 4.7, 0.2);
    systemTileObj.addUI(ui);
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
