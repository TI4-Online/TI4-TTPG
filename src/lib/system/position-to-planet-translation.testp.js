const {
    getClosestPlanet,
    getExactPlanet,
} = require("./position-to-planet-translation");
const { refObject } = require("@tabletop-playground/api");

refObject.addCustomAction("Closest Planet");
refObject.addCustomAction("Exact Planet");
refObject.addCustomAction("Destroy Planet");

refObject.onCustomAction.add((obj, player, actionName) => {
    if (actionName === "Closest Planet") {
        const closestPlanet = getClosestPlanet(obj.getPosition(), true);
        if (closestPlanet) {
            console.log(closestPlanet.raw.localeName);
        } else {
            console.log("No Closest Planet.");
        }
    } else if (actionName === "Exact Planet") {
        const exactPlanet = getExactPlanet(obj.getPosition(), true);
        if (exactPlanet) {
            console.log(exactPlanet.raw.localeName);
        } else {
            console.log("Not on a Planet.");
        }
    } else if (actionName === "Destroy Planet") {
        const exactPlanet = getExactPlanet(obj.getPosition());
        if (exactPlanet) {
            console.log("Destroying ", exactPlanet.raw.localeName);
            exactPlanet.destroyed = true;
        } else {
            console.log("Must be exactly on a planet to destroy it.");
        }
    }
});
