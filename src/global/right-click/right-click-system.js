const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { CommandToken } = require("../../lib/command-token/command-token");
const { ControlToken } = require("../../lib/control-token/control-token");
const { Explore } = require("../../lib/explore/explore");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { PopupPanel } = require("../../lib/ui/popup-panel");
const {
    SimpleGravRiftRoller,
    AutoGravRiftRoller,
} = require("./grav-rift-roller");
const {
    GameObject,
    Player,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

function getNamesAndActions(player, systemTileObj) {
    const namesAndActions = [
        {
            name: locale("ui.action.system.activate"),
            action: (player) => {
                CommandToken.activateSystem(systemTileObj, player);
            },
        },
        {
            // This could be disabled for empty systems (diplomcay rider
            // makes it legal for Mecatol).
            name: locale("ui.action.system.diplomacy"),
            action: (player) => {
                CommandToken.diplomacySystem(systemTileObj, player);
            },
        },
        {
            // This could be disabled for empty systems (diplomcay rider
            // makes it legal for Mecatol).
            name: locale("ui.action.system.control"),
            action: (player) => {
                ControlToken.spawnOnSystem(systemTileObj, player);
            },
        },
    ];

    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    if (system && system.anomalies.includes("gravity rift")) {
        namesAndActions.push({
            name: locale("ui.action.system.rift_roll"),
            action: (player) => {
                SimpleGravRiftRoller.roll(systemTileObj, player);
            },
            delayedHide: true,
        });
        namesAndActions.push({
            name: locale("ui.action.system.auto_rift_roll"),
            action: (player) => {
                AutoGravRiftRoller.roll(systemTileObj, player);
            },
        });
    }

    const exploreNamesAndActions = Explore.getExploreActionNamesAndActions(
        systemTileObj,
        player
    );
    for (const nameAndAction of exploreNamesAndActions) {
        namesAndActions.push({
            name: nameAndAction.name,
            action: (player) => {
                nameAndAction.action(player);
            },
        });
    }
    return namesAndActions;
}

function addRightClickOptions(systemTileObj) {
    assert(systemTileObj instanceof GameObject);

    // Skip home system placeholders and hyperlanes.
    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    if (!system || system.hyperlane) {
        return;
    }

    // Add as right-click options.  Not ideal because ground mode.
    // Might want to reset after adding mirage?
    // distant suns ability through right-click is awkward because we need
    // to know what all the options are before the player right-clicks
    const namesAndActions = getNamesAndActions(null, systemTileObj);
    for (const nameAndAction of namesAndActions) {
        systemTileObj.addCustomAction("*" + nameAndAction.name);
    }
    systemTileObj.onCustomAction.add((obj, player, actionName) => {
        assert(player instanceof Player);
        for (const nameAndAction of namesAndActions) {
            if ("*" + nameAndAction.name === actionName) {
                nameAndAction.action(player);
                break;
            }
        }
    });

    // Also offer via a popup.
    // Mallice needs to be flipped to see button, that's ok.
    const popupPanel = new PopupPanel(systemTileObj, new Vector(0, 4.6, 0.15))
        .setMatchPlayerYaw(true)
        .attachPopupButton(0.8);
    popupPanel.onShow.add((obj, player, popupPanel) => {
        popupPanel.reset();
        const namesAndActions = getNamesAndActions(player, systemTileObj);
        for (const nameAndAction of namesAndActions) {
            popupPanel.addAction(
                nameAndAction.name,
                (obj, player, actionName) => {
                    assert(player instanceof Player);
                    nameAndAction.action(player);
                },
                nameAndAction.delayedHide
            );
        }
    });
}

globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isSystemTile(obj)) {
        addRightClickOptions(obj);
    }
});

for (const obj of world.getAllObjects()) {
    if (ObjectNamespace.isSystemTile(obj)) {
        addRightClickOptions(obj);
    }
}
