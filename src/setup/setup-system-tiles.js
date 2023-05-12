const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const {
    Container,
    ObjectType,
    Rotator,
    Vector,
    world,
} = require("../wrapper/api");

const BAG = {
    nsid: "bag:base/generic",
    anchor: TableLayout.anchor.score,
    pos: { x: -50, y: 13.5, z: 3 },
    yaw: 0,
    scale: { x: 0.8, y: 0.8, z: 0.5 },
    colorHex: "#0033AA",
};

class SetupSystemTiles extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        let pos = new Vector(BAG.pos.x, BAG.pos.y, BAG.pos.z);
        let rot = new Rotator(0, BAG.yaw, 0);
        pos = TableLayout.anchorPositionToWorld(BAG.anchor, pos);
        rot = TableLayout.anchorRotationToWorld(BAG.anchor, rot);
        const bag = Spawn.spawn(BAG.nsid, pos, rot);
        bag.setName(locale("bag.system_tiles"));
        bag.setScale(new Vector(BAG.scale.x, BAG.scale.y, BAG.scale.z));
        bag.setPrimaryColor(ColorUtil.colorFromHex(BAG.colorHex));
        bag.setMaxItems(500);
        bag.setObjectType(ObjectType.Regular); // needs to be regular to explore

        const nsids = Spawn.getAllNSIDs().filter((nsid) => {
            if (!nsid.startsWith("tile.system")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            // Ignore home systems.
            const tile = Number.parseInt(parsed.name);
            const system = world.TI4.getSystemByTileNumber(tile);
            if (!system) {
                return false; // "0" reserved for home sytem marking
            }
            if (system.raw.home) {
                return false;
            }
            return true;
        });
        for (const nsid of nsids) {
            const above = pos.add([0, 0, 20]);
            const obj = Spawn.spawn(nsid, above, rot);

            // Sanity check system tile before adding it.
            const parsed = ObjectNamespace.parseSystemTile(obj);
            assert(parsed);
            const system = world.TI4.getSystemByTileNumber(parsed.tile);
            assert(system);
            assert(!system.raw.home);

            bag.addObjects([obj]);
        }
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            // Look inside containers too.
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const parsed = ObjectNamespace.parseSystemTile(obj);
            const system = world.TI4.getSystemByTileNumber(parsed.tile);
            if (!system) {
                continue; // home system placeholder
            }
            if (system && system.raw.home) {
                continue;
            }
            const container = obj.getContainer();
            if (container) {
                const above = container.getPosition().add([0, 0, 10]);
                if (container.take(obj, above)) {
                    obj.setTags(["DELETED_ITEMS_IGNORE"]);
                    obj.destroy();
                }
            } else {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }

        // Remove the box too.
        const name = locale("bag.system_tiles");
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Container)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "bag:base/generic") {
                continue;
            }
            if (obj.getName() !== name) {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupSystemTiles };
