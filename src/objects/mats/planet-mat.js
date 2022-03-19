const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    GameObject,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");
const { CardUtil } = require("../../lib/card/card-util");

// Fetch cards
class PlanetMat {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._actionNameToPlanet = {};

        globalEvents.TI4.onSystemActivated.add((systemTileObj, player) => {
            this.clearActionMenu();
            this.createActionMenu(systemTileObj);
        });

        this._obj.onCustomAction.add((obj, player, actionName) => {
            const planet = this._actionNameToPlanet[actionName];
            this.fetch(planet);
        });
    }

    clearActionMenu() {
        for (const actionName of Object.keys(this._actionNameToPlanet)) {
            this._obj.removeCustomAction(actionName);
        }
        this._actionNameToPlanet = {};
    }

    createActionMenu(systemTileObj) {
        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (!system) {
            console.log("PlanetMat.createActionMenu: no system");
            return;
        }

        for (const planet of system.planets) {
            const planetName = planet.getNameStr();
            const actionName = locale("ui.menu.fetch_planet", {
                planetName,
            });
            this._actionNameToPlanet[actionName] = planet;
            this._obj.addCustomAction(actionName);
        }
    }

    fetch(planet) {
        console.log(`PlanetMat.fetch(${planet.getNameStr()})`);

        const nsidSet = new Set();
        nsidSet.add(planet.getPlanetCardNsid());
        if (planet.raw.legendary) {
            nsidSet.add(planet.raw.legendaryCard);
        }
        for (const x of nsidSet) {
            console.log(`XXX ${x}`);
        }

        const cards = CardUtil.gatherCards((nsid) => {
            return nsidSet.has(nsid);
        });

        const pos = this._obj.getPosition().add([0, 0, 10]);
        const rot = this._obj.getRotation();
        for (const card of cards) {
            card.setPosition(pos, 1);
            card.setRotation(rot, 1);
        }
    }
}

refObject.onCreated.add((obj) => {
    new PlanetMat(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new PlanetMat(refObject);
}
