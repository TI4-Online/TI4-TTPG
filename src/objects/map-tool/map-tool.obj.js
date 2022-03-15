const { MapTool } = require("./map-tool");
const { UIElement, refObject, world } = require("../../wrapper/api");

function makeMapTool(obj) {
    const uiElement = new UIElement();
    const doRefresh = () => {
        obj.updateUI(uiElement);
    };
    const mapTool = new MapTool(doRefresh);
    uiElement.widget = mapTool.getUI();
    obj.addUI(uiElement);
}

refObject.onCreated.add((obj) => {
    makeMapTool(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    makeMapTool(refObject);
}
