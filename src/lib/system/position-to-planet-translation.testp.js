const {
    getClosestPlanet,
    getExactPlanet,
    getSystem,
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
        const exactPlanet = getExactPlanet(obj.getPosition(), false);
        if (exactPlanet) {
            console.log("Destroying ", exactPlanet.raw.localeName);
            const system = getSystem(obj.getPosition());
            system.system.planets.splice(
                system.system.planets.indexOf(exactPlanet),
                1
            );
        } else {
            console.log("Must be exactly on a planet to destroy it.");
        }
    }
});
