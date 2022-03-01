const { Gather } = require("./gather");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ReplaceObjects } = require("./replace-objects");
const { Spawn } = require("./spawn");
const {
    Card,
    Color,
    Rotator,
    Text,
    UIElement,
    Vector,
    refObject,
    world,
} = require("@tabletop-playground/api");

const ACTION = {
    CLEAN_ALL: "*Clean ALL",
    SPAWN_TYPES: "*Spawn TYPES",
    REMOVE_REPLACED: "*Remove replaced",
    GATHER_ON_TABLE: "*Gather on-table",
    GATHER_PER_PLAYER: "*Gather per-player",
    GATHER_PER_FACTION: "*Gather per-faction",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

function asyncSpawnTypes() {
    let nsids = Spawn.getAllNSIDs();
    nsids = nsids.filter(
        (nsid) => !ObjectNamespace.parseNsid(nsid).source.includes("homebrew")
    );
    const typeToNsids = Spawn.groupNSIDs(nsids);

    const x0 = 40;
    const y0 = -100;
    const z0 = world.getTableHeight() + 2;
    const yMax = 100;
    const dx = -15;
    const dy = 15;
    const pos = new Vector(x0, y0, z0);
    const rot = new Rotator(0, 0, 0);

    const nsidGroups = Object.values(typeToNsids);
    const processNext = () => {
        if (nsidGroups.length == 0) {
            console.log(`#objects = ${world.getAllObjects().length}`);
            return;
        }
        const nsids = nsidGroups.pop();

        pos.z = z0;
        let lastObj = false;
        for (const nsid of nsids) {
            const obj = Spawn.spawn(nsid, pos, rot);

            // Warn if not able to set a name.
            if (obj.getName().length === 0) {
                console.warn(`anonymous ${nsid}`);
            }

            pos.z += obj.getExtent().z * 2 + 10;

            if (obj instanceof Card && lastObj instanceof Card) {
                lastObj.addCards(obj);
            } else {
                lastObj = obj;
            }
        }

        pos.y += dy;
        if (pos.y > yMax) {
            pos.y = y0;
            pos.x += dx;
        }
        setTimeout(processNext, 100);
    };
    processNext();
}

function spawnChest(name, slotIndex) {
    const numCols = 14;
    const col = slotIndex % numCols;
    const row = Math.floor(slotIndex / numCols);
    const distanceBetween = 15;
    const pos = new Vector(
        -5 - row * distanceBetween,
        -100 + col * distanceBetween,
        world.getTableHeight() + 3
    );
    const rot = new Rotator(0, 0, 0);
    const bag = Spawn.spawnGenericContainer(pos, rot);
    bag.setName(name);

    const ui = new UIElement();
    ui.position = new Vector(0, 0, bag.getExtent().z + 1);
    ui.widget = new Text()
        .setText(name.replace(/ /g, "\n"))
        .setTextColor(new Color(0, 0, 0));
    bag.addUI(ui);
    bag.updateUI();
    return bag;
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.CLEAN_ALL) {
        for (const obj of world.getAllObjects()) {
            if (obj != refObject) {
                obj.destroy();
            }
        }
    } else if (actionName === ACTION.SPAWN_TYPES) {
        asyncSpawnTypes(player);
    } else if (actionName === ACTION.REMOVE_REPLACED) {
        const bag = spawnChest(actionName, 0);
        const objs = ReplaceObjects.getReplacedObjects();
        bag.addObjects(objs);
    } else if (actionName === ACTION.GATHER_ON_TABLE) {
        const bag = spawnChest(actionName, 1);
        bag.addObjects([Gather.gatherDeck("action")]);
        bag.addObjects([Gather.gatherDeck("agenda")]);
        bag.addObjects([Gather.gatherDeck("planet")]);
        bag.addObjects([Gather.gatherDeck("legendary_planet")]);
        bag.addObjects([Gather.gatherDeck("objective.public_1")]);
        bag.addObjects([Gather.gatherDeck("objective.public_2")]);
        bag.addObjects([Gather.gatherDeck("objective.secret")]);
        bag.addObjects([Gather.gatherDeck("exploration.cultural")]);
        bag.addObjects([Gather.gatherDeck("exploration.industrial")]);
        bag.addObjects([Gather.gatherDeck("exploration.hazardous")]);
        bag.addObjects([Gather.gatherDeck("exploration.frontier")]);
        bag.addObjects([Gather.gatherDeck("relic")]);
        bag.addObjects(Gather.gatherTableTokenAndTokenBags());
        bag.addObjects(Gather.gatherStrategyCards());
        bag.addObjects(Gather.gatherSystemTiles());

        // These are per-color, but group them for the table collection.
        const colors = [
            "white",
            "blue",
            "purple",
            "green",
            "red",
            "yellow",
            "orange",
            "pink",
            "brown",
        ];
        for (const color of colors) {
            bag.addObjects([Gather.gatherFactionPromissoryDeck(color)]);
        }
    } else if (actionName === ACTION.GATHER_PER_PLAYER) {
        const bag = spawnChest(actionName, 2);
        bag.addObjects([Gather.gatherGenericTechDeck()]);
        bag.addObjects(Gather.gatherUnitsAndUnitBags());
        bag.addObjects(Gather.gatherCoreTokenAndTokenBags()); // if giving a set to each player
        bag.addObjects(Gather.gatherSheets());
    } else if (actionName === ACTION.GATHER_PER_FACTION) {
        const factions = [
            "arborec",
            "argent",
            "creuss",
            "empyrean",
            "hacan",
            "jolnar",
            "l1z1x",
            "letnev",
            "mahact",
            "mentak",
            "muaat",
            "norr",
            "naalu",
            "naazrokha",
            "nekro",
            "nomad",
            "saar",
            "sol",
            "ul",
            "vuilraith",
            "winnu",
            "xxcha",
            "yin",
            "yssaril",
        ];
        for (let i = 0; i < factions.length; i++) {
            const faction = factions[i];
            console.log(`Gathering "${faction}"`);
            const bag = spawnChest(`${actionName} (${faction})`, 3 + i);

            bag.addObjects([Gather.gatherFactionPromissoryDeck(faction)]);

            bag.addObjects([Gather.gatherFactionAllainceCard(faction)]);
            bag.addObjects([Gather.gatherFactionTechDeck(faction)]);
            bag.addObjects([Gather.gatherFactionLeadersDeck(faction)]);
            bag.addObjects([Gather.gatherFactionTokenCard(faction)]);

            bag.addObjects([Gather.gatherFactionReferenceCard(faction)]);
            bag.addObjects(Gather.gatherFactionTokens(faction));
        }
    }
});
