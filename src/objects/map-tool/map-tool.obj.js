const { MapTool } = require("./map-tool");
const { refObject, world } = require("../../wrapper/api");

refObject.onCreated.add((obj) => {
    new MapTool(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new MapTool(refObject);
}
