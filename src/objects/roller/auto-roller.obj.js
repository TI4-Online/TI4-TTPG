const { AutoRoller } = require("./auto-roller");
const { refObject, world } = require("../../wrapper/api");

refObject.onCreated.add((obj) => {
    new AutoRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AutoRoller(refObject);
}
