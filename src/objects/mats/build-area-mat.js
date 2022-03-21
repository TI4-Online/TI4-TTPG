const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");
const {
    Border,
    Button,
    Card,
    GameObject,
    Rotator,
    UIElement,
    Vector,
    VerticalBox,
    ZonePermission,
    refObject,
    world,
} = require("../../wrapper/api");

const TYPE = {
    UNIT: "unit",
    TRADEGOOD: "tradegood",
    PLANET: "planet",
};

class BuildAreaMat {
    static getProduceEntry(obj) {
        assert(obj instanceof GameObject);

        const unitPlastic = UnitPlastic.getOne(obj);
        const attrs =
            unitPlastic && UnitAttrs.getDefaultUnitAttrs(unitPlastic.unit);

        if (attrs && attrs.raw.cost) {
            return {
                obj,
                type: TYPE.UNIT,
                unit: unitPlastic.unit,
                count: unitPlastic.count,
            };
        }
    }

    static getConsumeEntry(obj) {
        assert(obj instanceof GameObject);

        const nsid = ObjectNamespace.getNsid(obj);

        // Consume tradegood(s)?
        if (nsid === "token:base/tradegood_commodity_1") {
            return {
                obj,
                type: TYPE.TRADEGOOD,
                count: 1,
            };
        }
        if (nsid === "token:base/tradegood_commodity_3") {
            return {
                obj,
                type: TYPE.TRADEGOOD,
                count: 3,
            };
        }

        const planet = obj instanceof Card && world.TI4.getPlanetByCard(obj);
        if (planet) {
            const value = planet.raw.resources || 0;
            return {
                obj,
                type: TYPE.PLANET,
                name: planet.getNameStr(),
                value,
            };
        }
    }

    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._zone = undefined;
        this._updateHandle = undefined;

        // GameObject.getExtent changes after adding UI.  Read it now.
        this._extent = this._obj.getExtent().clone();

        this._obj.onDestroyed.add(() => {
            this._destroyZone();
        });
        this._obj.onGrab.add(() => {
            this._destroyZone();
        });

        this._obj.onReleased.add(() => {
            this._createZone();
        });
        this._obj.onMovementStopped.add(() => {
            this._createZone();
        });

        this._uiBox = new Border().setColor([1, 0, 0]);

        const pad = 1;
        const ui = new UIElement();
        ui.useWidgetSize = false;
        ui.width = this._extent.x * 20 - pad * 20; // ui is 10x
        ui.height = 20;
        ui.anchorX = 0;
        ui.anchorY = 0;
        ui.position = new Vector(
            this._extent.x - pad,
            -this._extent.y + pad,
            this._extent.z * 2 + 0.01
        );
        ui.widget = this._uiBox;
        this._obj.addUI(ui);

        this._createZone();
        this.update();
    }

    _createUI() {
        assert(this._uiBox);
    }

    _destroyZone() {
        // On refresh zone persists but this._zone does not.  Search for zone.
        const zoneId = ObjectSavedData.get(this._obj, "zoneId", undefined);
        if (zoneId === undefined) {
            return; // no zone yet
        }
        for (const zone of world.getAllZones()) {
            if (zone.getSavedData() === zoneId) {
                zone.destroy();
            }
        }
        this._zone = undefined;
    }

    _createZone() {
        this._destroyZone();

        let zoneId = ObjectSavedData.get(this._obj, "zoneId", undefined);
        if (zoneId === undefined) {
            zoneId = `zone:${this._obj.getId()}`;
            ObjectSavedData.set(this._obj, "zoneId", zoneId);
        }

        const extent = this._extent; // recorded before adding UI
        const zoneScale = new Vector(extent.x * 2, extent.y * 2, 4);
        const zonePos = this._obj.getPosition().add([0, 0, zoneScale.z / 2]);
        this._zone = world.createZone(zonePos);
        this._zone.setSavedData(zoneId);
        this._zone.setRotation(this._obj.getRotation());
        this._zone.setScale(zoneScale);
        this._zone.setStacking(ZonePermission.Nobody);
        this._zone.setColor([1, 0, 0, 0.1]);
        this._zone.setAlwaysVisible(false);
        this._zone.onBeginOverlap.add((zone, obj) => {
            if (obj === this._obj) {
                return;
            }
            this.scheduleUpdate();
        });
        this._zone.onEndOverlap.add((zone, obj) => {
            if (obj === this._obj) {
                return;
            }
            this.scheduleUpdate();
        });
    }

    scheduleUpdate() {
        if (this._updateHandle) {
            clearTimeout(this._updateHandle);
            this._updateHandle = undefined;
        }
        const handler = () => {
            this.update();
        };
        this._updateHandle = setTimeout(handler, 100);
    }

    update() {
        assert(this._zone);
        console.log("BuildAreaMat.update");

        // What's inside area?
        const produce = [];
        const consume = [];
        const overlapping = this._zone.getOverlappingObjects();
        for (const obj of overlapping) {
            if (obj === this._obj) {
                continue; // ignore mat
            }
            const produceEntry = BuildAreaMat.getProduceEntry(obj);
            if (produceEntry) {
                produce.push(produceEntry);
            }
            const consumeEntry = BuildAreaMat.getConsumeEntry(obj);
            if (consumeEntry) {
                consume.push(consumeEntry);
            }
        }

        // Group same-units together.
        let unitToCount = {};
        for (const produceEntry of produce) {
            if (produceEntry.type === TYPE.UNIT) {
                unitToCount[produceEntry.unit] =
                    (unitToCount[produceEntry.unit] || 0) + produceEntry.count;
            }
        }

        // Get per-unit data.
        const pos = this._obj.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const auxData = new AuxDataBuilder()
            .setPlayerSlot(playerSlot)
            .setFaction(faction)
            .build();

        // Compute produce cost, account for multiple units per produce.
        let totalCost = 0;
        for (const [unit, count] of Object.entries(unitToCount)) {
            const attrs = auxData.unitAttrsSet.get(unit);
            const produce = attrs.raw.produce || 1;
            const invokeCount = Math.ceil(count / produce);
            const cost = invokeCount * attrs.raw.cost;
            totalCost += cost;
        }
        console.log(`totalCost: ${totalCost}`);
    }
}

refObject.onCreated.add((obj) => {
    new BuildAreaMat(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new BuildAreaMat(refObject);
}

if (world.__isMock) {
    module.exports = { BuildAreaMat };
}
