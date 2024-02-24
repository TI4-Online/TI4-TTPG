/**
 * Move units and faction sheet below, planet and tech boards up.
 */

const {
    Card,
    ObjectType,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

// Move object and everything on it.
// Preserves rotations; simple offsets enough (vs transforms).
// Careful about leader/command sheet overlapping faction sheet.
function delayedMove(moveObj, dst, extraZ = 0) {
    const src = moveObj.getPosition();
    const playerDesk = world.TI4.getClosestPlayerDesk(src);
    dst = playerDesk.localPositionToWorld(dst);
    dst.z = src.z + extraZ;

    const boxPos = src.add([0, 0, 2]);
    const boxExtent = moveObj.getExtent().add([0, 0, 4]);
    const boxRot = moveObj.getRotation();

    const linkedObjects = world
        .boxOverlap(boxPos, boxExtent, boxRot)
        .filter((obj) => {
            if (obj === moveObj) {
                return false;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (
                nsid.startsWith("sheet") ||
                nsid === "pad:base/status" ||
                nsid.startsWith("bag.") ||
                nsid.startsWith("mat") ||
                nsid.startsWith("cardholder")
            ) {
                return false;
            }
            if (obj instanceof Card && obj.getStackSize() > 1) {
                return false;
            }
            return true;
        });

    return () => {
        const origType = moveObj.getObjectType();
        moveObj.setObjectType(ObjectType.Regular);
        moveObj.setPosition(dst);
        process.nextTick(() => {
            moveObj.setObjectType(origType);
        });
        for (const linkedObject of linkedObjects) {
            const offset = linkedObject
                .getPosition()
                .subtract(src)
                .add([0, 0, extraZ]);
            linkedObject.setPosition(dst.add(offset));
        }
    };
}

globalEvents.onChatMessage.add((sender, message) => {
    if (message !== "!layoutpizzajj") {
        return; // not the command messge
    }

    const playerSlot = sender.getSlot();
    console.log(`"${message}" from ${sender.getName()}`);

    const runnables = [];
    for (const obj of world.getAllObjects(true)) {
        const nsid = ObjectNamespace.getNsid(obj);
        const owned = obj.getOwningPlayerSlot() === playerSlot;
        const closest =
            world.TI4.getClosestPlayerDesk(obj.getPosition()).playerSlot ===
            playerSlot; // ineffient to get here, but this is a very rare action

        if (nsid === "sheet:pok/leader" && owned) {
            runnables.push(delayedMove(obj, new Vector(27, 9.5, 0), 0.1));
        }
        if (nsid.startsWith("sheet.faction") && closest) {
            runnables.push(delayedMove(obj, new Vector(-12, 9.5, 0)));
        }
        if (nsid === "sheet:base/command" && owned) {
            runnables.push(delayedMove(obj, new Vector(27, 26, 0)));
        }
        if (nsid === "mat:base/build_area" && closest) {
            runnables.push(delayedMove(obj, new Vector(-1, -14.8, 0)));
        }
        if (nsid === "mat:base/planets" && closest) {
            runnables.push(delayedMove(obj, new Vector(23, -15, 0)));
        }
        if (nsid === "mat:base/tech" && closest) {
            runnables.push(delayedMove(obj, new Vector(7.5, 12.2, 0)));
        }
        if (
            obj instanceof Card &&
            closest &&
            obj.getStackSize() > 1 &&
            ObjectNamespace.getDeckNsids(obj)[0].startsWith("card.technology")
        ) {
            runnables.push(delayedMove(obj, new Vector(1, 34, 0)));
        }
    }
    for (const runnable of runnables) {
        runnable();
    }
});

/*
process.nextTick(() => {
    const commandSheet = world.getObjectById("z6r");
    let runnable = delayedMove(commandSheet, new Vector(27, 26, 0));
    runnable();

    const leaderSheet = world.getObjectById("zdl");
    runnable = delayedMove(leaderSheet, new Vector(27, 9.5, 0), 0.1);
    runnable();

    const planetMat = world.getObjectById("ob1");
    runnable = delayedMove(planetMat, new Vector(23, -15, 0));
    runnable();

    const techMat = world.getObjectById("wwy");
    runnable = delayedMove(techMat, new Vector(7.5, 12.2, 0));
    runnable();

    const buildMat = world.getObjectById("fnh");
    runnable = delayedMove(buildMat, new Vector(-1, -14.8, 0));
    runnable();

    const techDeck = world.getObjectById("tpz");
    runnable = delayedMove(techDeck, new Vector(1, 34, 0));
    runnable();

    const factionSheet = world.getObjectById("avg");
    runnable = delayedMove(factionSheet, new Vector(-12, 9.5, 0));
    runnable();

    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        playerDesk._removePlayerDeskUI();
    }
});
*/
