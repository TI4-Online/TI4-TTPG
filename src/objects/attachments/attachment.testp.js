const { refObject, world } = require("../../wrapper/api");
const { getClosestPlanet } = require("../../lib/system/position-to-planet");

refObject.addCustomAction("Planet Attributes");
refObject.addCustomAction("System Attributes");

refObject.onCustomAction.add((obj, _player, actionName) => {
    if (actionName === "Planet Attributes") {
        const planet = getClosestPlanet(obj.getPosition());
        if (planet) {
            console.log(planet.localeName);
            console.log(`Resources: ${planet.raw.resources}`);
            console.log(`Influence: ${planet.raw.influence}`);
            console.log(`legendary: ${planet.raw.legendary}`);
            console.log(`traits: ${JSON.stringify(planet.raw.trait)}`);
            console.log(`tech: ${JSON.stringify(planet.raw.tech)}`);
            console.log(`destroyed: ${planet.destroyed}`);
        } else {
            console.log("Place on system with planet to get planet attributes");
        }
    } else if (actionName == "System Attributes") {
        const pos = obj.getPosition();
        const systemObject = world.TI4.getSystemTileObjectByPosition(pos);
        if (systemObject) {
            const system = world.TI4.getSystemBySystemTileObject(systemObject);
            console.log(`System: ${system.tile}`);
            console.log(`wormholes: ${JSON.stringify(system.wormholes)}`);
            console.log(
                `planets: ${JSON.stringify(
                    system.planets.map((element) => element.localeName)
                )}`
            );
            console.log(`anomalies: ${JSON.stringify(system.anomalies)}`);
        }
    }
});
