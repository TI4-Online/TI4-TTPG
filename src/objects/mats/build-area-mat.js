const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");
const {
    Border,
    Button,
    Canvas,
    Card,
    GameObject,
    HorizontalAlignment,
    HorizontalBox,
    ImageButton,
    LayoutBox,
    Text,
    UIElement,
    Vector,
    VerticalAlignment,
    VerticalBox,
    ZonePermission,
    refObject,
    refPackageId,
    world,
} = require("../../wrapper/api");

const TYPE = {
    UNIT: "unit",
    TRADEGOOD: "tradegood",
    PLANET: "planet",
};

const NSID_TO_PRODUCE_LOCALE_EXTRA = {
    "card.technology.yellow:base/sarween_tools": "ui.build.sarween_tools_abbr",
    "card.action:codex.ordinian/war_machine.1": "ui.build.war_machine_abbr",
    "card.action:codex.ordinian/war_machine.2": "ui.build.war_machine_abbr",
    "card.action:codex.ordinian/war_machine.3": "ui.build.war_machine_abbr",
    "card.action:codex.ordinian/war_machine.4": "ui.build.war_machine_abbr",
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
                value: 1,
                count: 1,
            };
        }
        if (nsid === "token:base/tradegood_commodity_3") {
            return {
                obj,
                type: TYPE.TRADEGOOD,
                value: 1,
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
                count: 1,
            };
        }
    }

    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._zone = undefined;
        this._updateHandle = undefined;

        this._ui = {
            uiE: undefined,
            cost: undefined,
            resources: undefined,
            unitCount: undefined,
            production: undefined,
        };
        this._popupUI = undefined;

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

        this._createPopupUI();
        this._createUI();
        this._createZone();
        this.update();
    }

    _createUI() {
        // Get layout position and size.
        const scale = 4;
        const pad = 0.35;
        const fontSize = 5.8 * scale;
        const size = {
            w: (this._extent.x * 20 - pad * 20) * scale, // ui is 10x
            h: 15 * scale,
        };
        const pos = new Vector(
            this._extent.x - pad,
            -this._extent.y + pad,
            this._extent.z + 0.01
        );

        // Attach a canvas.
        const canvas = new Canvas();
        this._ui.uiE = new UIElement();
        this._ui.uiE.useWidgetSize = false;
        this._ui.uiE.width = size.w;
        this._ui.uiE.height = size.h;
        this._ui.uiE.scale = 1 / scale;
        this._ui.uiE.anchorX = 0;
        this._ui.uiE.anchorY = 0;
        this._ui.uiE.position = pos;
        this._ui.uiE.widget = canvas;
        this._obj.addUI(this._ui.uiE);

        canvas.addChild(
            new Border(), //.setColor([0.3, 0, 0]),
            0,
            0,
            size.w,
            size.h
        );

        // Layout.
        this._ui.cost = new Text().setFontSize(fontSize);
        this._ui.resources = new Text().setFontSize(fontSize);
        this._ui.unitCount = new Text().setFontSize(fontSize);
        this._ui.production = new Text().setFontSize(fontSize);

        const panel = new HorizontalBox()
            .setChildDistance(size.h / 3)
            .addChild(this._ui.cost)
            .addChild(this._ui.resources)
            .addChild(this._ui.unitCount);
        const box = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(panel);

        // Leave room for button on right.
        canvas.addChild(box, 0, 0, size.w - size.h, size.h);

        const p = size.h * 0.05;
        const buttonSize = size.h - p * 2;
        const button = new ImageButton()
            .setImage("global/ui/menu_button_hex.png", refPackageId)
            .setImageSize(buttonSize, buttonSize);
        button.onClicked.add((button, player) => {
            this.closePopupMenu();
            this.createPopupMenu();
        });
        canvas.addChild(
            button,
            size.w - buttonSize - p,
            p,
            buttonSize,
            buttonSize
        );
    }

    _createPopupUI() {
        this._popupUI = new UIElement();
        this._popupUI.position = new Vector(this._extent.x, this._extent.y, 3);
        this._popupUI.widget = new Border();
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

        // Some things can be anywhere on table.
        let consumeExtras = [];
        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        const myDesk = world.TI4.getClosestPlayerDesk(this._obj.getPosition());
        for (const obj of world.getAllObjects()) {
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            const localeExtra = NSID_TO_PRODUCE_LOCALE_EXTRA[nsid];
            if (!localeExtra) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== myDesk) {
                continue;
            }
            const extra = locale(localeExtra);
            if (consumeExtras.includes(extra)) {
                continue;
            }
            consumeExtras.push(extra);
        }
        consumeExtras = consumeExtras.sort();

        // Group same-units together.
        let unitToCount = {};
        let totalUnitCount = 0;
        for (const produceEntry of produce) {
            if (produceEntry.type === TYPE.UNIT) {
                unitToCount[produceEntry.unit] =
                    (unitToCount[produceEntry.unit] || 0) + produceEntry.count;
                totalUnitCount += produceEntry.count;
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

        // Compute consumed resources.
        let totalResources = 0;
        for (const consumeEntry of consume) {
            totalResources += consumeEntry.count * consumeEntry.value;
        }
        if (consumeExtras.length > 0) {
            totalResources = `${totalResources}+${consumeExtras.join("+")}`;
        }

        // TODO XXX unitAttrs.freeProduce
        // TODO XXX unitAttrs.sharedFreeProduce

        this._ui.cost.setText(locale("ui.build.cost", { cost: totalCost }));
        this._ui.resources.setText(
            locale("ui.build.resources", { resources: totalResources })
        );
        this._ui.unitCount.setText(
            locale("ui.build.unitCount", { unitCount: totalUnitCount })
        );
        this._obj.updateUI(this._ui.uiE);
    }

    closePopupMenu() {
        assert(this._popupUI);

        this._obj.removeUIElement(this._popupUI);
    }

    createPopupMenu() {
        assert(this._popupUI);

        const panel = new VerticalBox();

        // TODO XXX MOVE TO ACTIVE SYSTEM
        // TODO XXX MOVE TO HOME SYSTEM
        // TODO CLEAR TRADE GOODS
        // const button = new Button().setText("something something");
        // button.onClicked.add((button, player) => {
        //     this.closePopupMenu();
        // });
        // panel.addChild(button);

        const cancelButton = new Button().setText(locale("ui.button.cancel"));
        cancelButton.onClicked.add((button, player) => {
            this.closePopupMenu();
        });
        panel.addChild(cancelButton);

        this._popupUI.widget.setChild(panel);
        this._obj.addUI(this._popupUI);
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
