/**
 * Place on a generic tile, summarize adjacent tiles' values.
 */

const assert = require("../wrapper/assert-wrapper");
const { Hex } = require("../lib/hex");
const {
    GameObject,
    LayoutBox,
    Text,
    TextJustification,
    UIElement,
    Vector,
    VerticalAlignment,
    refObject,
    world,
} = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");
const { ColorUtil } = require("../lib/color/color-util");

const COLORS = [
    "#F0F0F0", // white
    "#00CFFF", // blue
    "#572780", // purple
    "#D7B700", // yellow
    "#FF1010", // red
    "#00FF00", // green
    "#F46FCD", // pink
    "#FC6A03", // orange
    "#6E260E", // brown
];

const SCALE = 2;

class MapBuilderHelper {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._text = new Text()
            .setAutoWrap(false)
            .setFontSize(10 * SCALE)
            .setJustification(TextJustification.Center)
            .setTextColor([0, 0, 0, 1]);

        const widget = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._text);
        const ui = new UIElement();
        ui.position = new Vector(0, 0, 0.21);
        ui.scale = 1 / SCALE;
        ui.widget = widget;
        gameObject.addUI(ui);

        gameObject.setTags(["DELETED_ITEMS_IGNORE"]);

        // Change color to avoid collisions with peers.
        const nsid = ObjectNamespace.getNsid(gameObject);
        const skipContained = true;
        const numPeers = world.getAllObjects(skipContained).filter((peer) => {
            const peerNsid = ObjectNamespace.getNsid(peer);
            if (peerNsid !== nsid) {
                return false;
            }
            if (peer === gameObject) {
                return false;
            }
            return true;
        }).length;
        const colorHex = COLORS[numPeers % COLORS.length];
        const color = ColorUtil.colorFromHex(colorHex);
        gameObject.setPrimaryColor(color);

        // Periodic update.
        const doUpdate = () => {
            world.TI4.asyncTaskQueue.add(() => {
                this.update();
            });
        };
        const intervalHandle = setInterval(doUpdate, 1000);
        gameObject.onDestroyed.add(() => {
            clearInterval(intervalHandle);
        });
    }

    update() {
        const systems = this._getTransitiveAdjacentSystems();
        const tiles = systems.map((system) => system.tile);
        const summary = world.TI4.System.summarizeRaw(tiles);

        let name = this._obj.getName();
        if (name.length === 0) {
            name = "<name>";
        }

        const {
            res,
            optRes,
            inf,
            optInf,
            tech,
            traits,
            wormholes,
            legendaries,
        } = summary;

        const result = [name, `${res}/${inf}`, `(${optRes}/${optInf})`];
        result.push(`Tech: ${tech.sort().join("")}`);
        result.push(`Traits: ${traits.sort().join("")}`);
        result.push(`Wormholes: ${wormholes.sort().join("")}`);
        result.push(`Legendaries: ${legendaries.length}`);

        const pos = this._obj.getPosition();
        const hex = Hex.fromPosition(pos);
        result.push(`Hex: ${hex}`);

        const value = result.join("\n");

        this._text.setText(value);
    }

    _getHexToSystem() {
        const hexToSystem = {};
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (!system) {
                continue;
            }
            const hex = Hex.fromPosition(obj.getPosition());
            hexToSystem[hex] = system;
        }
        return hexToSystem;
    }

    _getTransitiveAdjacentSystems() {
        const toVisit = new Set();
        const visited = new Set();

        // Seed with our hex.
        const objPos = this._obj.getPosition();
        const objHex = Hex.fromPosition(objPos);
        for (const neighbor of Hex.neighbors(objHex)) {
            toVisit.add(neighbor);
        }

        const hexToSystem = this._getHexToSystem();
        const result = [];

        while (toVisit.size > 0) {
            const hex = toVisit.values().next().value;
            assert(typeof hex === "string");

            toVisit.delete(hex);
            visited.add(hex);

            // Check hex.
            const system = hexToSystem[hex];
            if (!system) {
                continue;
            }

            result.push(system);

            // Expand to neighbors.
            for (const neighbor of Hex.neighbors(hex)) {
                if (!visited.has(neighbor)) {
                    toVisit.add(neighbor);
                }
            }
        }
        return result;
    }
}

process.nextTick(() => {
    new MapBuilderHelper(refObject);
});
