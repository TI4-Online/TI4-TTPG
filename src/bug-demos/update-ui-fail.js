const {
    refObject,
    world,
    Text,
    UIElement,
    Vector,
} = require("@tabletop-playground/api");

/**
 * BUG: GameObject.updateUI does not refresh after changing widget.
 *
 * RESOLVED: documentation for GameObject.updateUI is incorrect,
 * need to either replace or GameObject.setUI to update a widget change.
 *
 * @param {GameObject} obj
 */
function demoUiUpdateBug(obj) {
    const uiElement = new UIElement();
    uiElement.position = new Vector(0, 0, 5);

    // Add a random widget so addUI succeeds.
    uiElement.widget = new Text().setText("<ORIGINAL>");
    obj.addUI(uiElement);

    obj.addCustomAction("*updateUI");
    obj.addCustomAction("*re-addUI");
    obj.onCustomAction.add((obj, player, actionName) => {
        if (actionName === "*updateUI") {
            // Expect updateUI to refresh, it does not.
            console.log(actionName);
            uiElement.widget = new Text().setText("<UPDATE>");
            obj.updateUI(uiElement);
        } else if (actionName === "*re-addUI") {
            // Removing and re-adding does refresh.
            console.log(actionName);
            obj.removeUI(uiElement);
            uiElement.widget = new Text().setText("<RE-ADD>");
            obj.addUI(uiElement);
        }
    });
}

refObject.onCreated.add((obj) => {
    demoUiUpdateBug(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    demoUiUpdateBug(refObject);
}
