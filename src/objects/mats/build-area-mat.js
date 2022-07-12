const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { Broadcast } = require("../../lib/broadcast");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const { PopupPanel } = require("../../lib/ui/popup-panel");
const { Technology } = require("../../lib/technology/technology");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");
const {
    Border,
    Canvas,
    Card,
    GameObject,
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Player,
    Rotator,
    Text,
    UIElement,
    Vector,
    VerticalAlignment,
    Zone,
    ZonePermission,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");

const MAT_WIDTH = 18.4;
const MAT_HEIGHT = 18.4;

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

const _playerSlotToLastActivatedSystemTileObj = {};
globalEvents.TI4.onSystemActivated.add((systemTileObj, player) => {
    assert(systemTileObj instanceof GameObject);
    assert(player instanceof Player);
    const playerSlot = player.getSlot();
    _playerSlotToLastActivatedSystemTileObj[playerSlot] = systemTileObj;
});

class BuildAreaMat {
    static getLastActivatedSystem(playerSlot) {
        assert(typeof playerSlot === "number");
        return _playerSlotToLastActivatedSystemTileObj[playerSlot];
    }

    static getHomeSystem(playerSlot) {
        assert(typeof playerSlot === "number");
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            console.log("BuildAreaMat.getHomeSystem: no faction");
            return;
        }
        const homeNsid = faction.homeNsid;
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === homeNsid) {
                return obj;
            }
        }
        console.log(
            `BuildAreaMat.getHomeSystem: no system tile object (${homeNsid})`
        );
    }

    static getProduceEntry(obj) {
        assert(obj instanceof GameObject);

        const unitPlastic = UnitPlastic.getOne(obj);
        if (unitPlastic) {
            return {
                obj,
                type: TYPE.UNIT,
                unit: unitPlastic.unit,
                count: unitPlastic.count,
            };
        }
    }

    static getConsumeEntry(obj, hasXxchaHeroCodex3) {
        assert(obj instanceof GameObject);
        assert(typeof hasXxchaHeroCodex3 === "boolean");

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
            let value = planet.raw.resources || 0;
            if (hasXxchaHeroCodex3) {
                value += planet.raw.influence || 0;
            }
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
        this._popup = new PopupPanel(
            gameObject,
            new Vector(MAT_WIDTH / 2, MAT_HEIGHT / 2, 0.26)
        );

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

        this._createUI();
        this._createPopupUI();
        this._createZone();
        this.update();
    }

    _createUI() {
        // Get layout position and size.
        const scale = 4;
        const pad = 0.35;
        const fontSize = 5.8 * scale;
        const size = {
            w: (MAT_WIDTH * 10 - pad * 20) * scale, // ui is 10x
            h: 15 * scale,
        };
        const pos = new Vector(
            MAT_WIDTH / 2 - pad,
            -(MAT_HEIGHT / 2) + pad,
            0.13 + CONFIG.buttonLift
        );

        const canvas = new Canvas();
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
        canvas.addChild(
            this._popup.createPopupButton(),
            size.w - buttonSize - p,
            p,
            buttonSize,
            buttonSize
        );

        // Attach a canvas.
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
    }

    _createPopupUI() {
        this._popup
            .addAction(locale("ui.build.report"), (obj, player, actionName) => {
                this.reportBuild();
            })
            .addAction(
                locale("ui.build.warp_to_home"),
                (obj, player, actionName) => {
                    const playerSlot = this._getPlayerSlot();
                    const systemTileObj =
                        BuildAreaMat.getHomeSystem(playerSlot);
                    this.moveUnitsToSystem(systemTileObj, player);
                }
            )
            .addAction(
                locale("ui.build.warp_to_last_actived"),
                (obj, player, actionName) => {
                    const playerSlot = this._getPlayerSlot();
                    const systemTileObj =
                        BuildAreaMat.getLastActivatedSystem(playerSlot);
                    this.moveUnitsToSystem(systemTileObj, player);
                }
            )
            .addAction(
                locale("ui.build.toggle_privacy"),
                (obj, player, actionName) => {
                    assert(this._zone);
                    const oldValue = this._zone.isAlwaysVisible();
                    const newValue = !oldValue;
                    this._zone.setAlwaysVisible(newValue);
                    this._zone.setObjectVisibility(
                        newValue
                            ? ZonePermission.OwnersOnly
                            : ZonePermission.Everybody
                    );
                }
            );
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

        const c = 0.7;
        const zoneScale = new Vector(MAT_WIDTH, MAT_HEIGHT, 4);
        const zonePos = this._obj.getPosition().add([0, 0, zoneScale.z / 2]);
        this._zone = world.createZone(zonePos);
        this._zone.setSavedData(zoneId);
        this._zone.setRotation(this._obj.getRotation());
        this._zone.setScale(zoneScale);
        this._zone.setStacking(ZonePermission.Nobody);
        this._zone.setSlotOwns(this._getPlayerSlot(), true);
        this._zone.setColor([c, c, c, 0.1]);
        this._zone.setAlwaysVisible(false);
        this._zone.onBeginOverlap.add((zone, obj) => {
            this.maybeScheduleUpdate(zone, obj);
        });
        this._zone.onEndOverlap.add((zone, obj) => {
            this.maybeScheduleUpdate(zone, obj);
        });
    }

    _getPlayerSlot() {
        const pos = this._obj.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        return playerDesk.playerSlot;
    }

    getAiDevConsumeExtra() {
        const playerSlot = this._getPlayerSlot();
        const techs = Technology.getOwnedPlayerTechnologies(playerSlot);
        const updates = techs.filter((tech) => {
            return tech.type === "unitUpgrade";
        });
        let value = updates.length;
        return locale("ui.build.ai_dev_abbr", { value });
    }

    maybeScheduleUpdate(zone, obj) {
        assert(zone instanceof Zone);
        assert(obj instanceof GameObject);

        if (obj === this._obj) {
            return;
        }
        if (!obj.isValid()) {
            return;
        }
        if (!this._obj.isValid()) {
            return;
        }
        if (!this._zone || zone !== this._zone) {
            return;
        }
        if (!zone.isValid()) {
            return;
        }
        this.scheduleUpdate();
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
        if (!this._zone) {
            return;
        }
        assert(this._zone instanceof Zone);
        let consumeExtras = [];

        // Check for Xxcha hero codex 3 before gathering consume entries.
        const playerSlot = this._getPlayerSlot();
        const xxchaHeroCodex3Nsid =
            "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
        let hasXxchaHeroCodex3 = CardUtil.hasCard(
            playerSlot,
            xxchaHeroCodex3Nsid
        );

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
            const consumeEntry = BuildAreaMat.getConsumeEntry(
                obj,
                hasXxchaHeroCodex3
            );
            if (consumeEntry) {
                consume.push(consumeEntry);
            }
            // AI Dev handling.
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "card.technology.red:pok/ai_development_algorithm") {
                const summary = this.getAiDevConsumeExtra();
                consumeExtras.push(summary);
            }
        }

        // Some things can be anywhere on table.
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
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const auxData = new AuxDataBuilder()
            .setPlayerSlot(playerSlot)
            .setFaction(faction)
            .build();

        // Apply unit upgrades.
        new AuxDataPair(auxData, new AuxDataBuilder().build()).fillPairSync();

        // Compute produce cost, account for multiple units per produce.
        let totalCost = 0;
        for (const [unit, count] of Object.entries(unitToCount)) {
            const attrs = auxData.unitAttrsSet.get(unit);
            const produce = attrs.raw.produce || 1;
            const invokeCount = Math.ceil(count / produce);
            const cost = invokeCount * (attrs.raw.cost || 0);
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

        return {
            produce,
            consume,
            unitToCount,
            totalUnitCount,
        };
    }

    reportBuild() {
        const { unitToCount } = this.update();
        let build = [];
        for (const [unit, count] of Object.entries(unitToCount)) {
            build.push(`${count} ${unit}`);
        }
        build = build.join(", ");

        const playerSlot = this._getPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerName = faction ? faction.nameFull : playerDesk.colorName;
        const color = playerDesk.color;

        const msg = locale("ui.build.report.output", { playerName, build });
        Broadcast.chatAll(msg, color);
    }

    moveUnitsToSystem(systemTileObj, player) {
        assert(!systemTileObj || systemTileObj instanceof GameObject);
        assert(player instanceof Player);

        if (!systemTileObj) {
            const msg = locale("ui.build.warp_target_missing");
            player.sendChatMessage(msg, [1, 0, 0]);
            return;
        }

        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (system) {
            const msg = locale("ui.build.warp.output", {
                warpTarget: system.getSummaryStr(),
            });
            player.sendChatMessage(msg);
        }

        const objs = [];
        const { produce } = this.update();
        for (const produceEntry of produce) {
            if (produceEntry.type === TYPE.UNIT) {
                assert(produceEntry.obj instanceof GameObject);
                objs.push(produceEntry.obj);
            }
        }

        const r = 3.5;
        const dPhi = (Math.PI * 2) / objs.length;
        objs.forEach((obj, index) => {
            const phi = dPhi * index;
            let pos = new Vector(Math.cos(phi) * r, Math.sin(phi) * r, 0);
            pos = systemTileObj
                .localPositionToWorld(pos)
                .add([0, 0, 5 + index / 2]);
            const rot = new Rotator(0, obj.getRotation().yaw, 0);
            obj.setPosition(pos, 1);
            obj.setRotation(rot, 1);
        });
    }
}

let _createOnlyOnceCalled = false;
const createOnlyOnce = (obj) => {
    assert(obj instanceof GameObject);
    if (_createOnlyOnceCalled || world.__isMock) {
        return;
    }
    _createOnlyOnceCalled = true;
    new BuildAreaMat(obj);
};

refObject.onCreated.add((obj) => {
    // DO NOT CREATE UI IN ONCREATED CALLBACK, IT WILL LINGER ACROSS RELOAD
    // AND PROBABLY CAUSES OTHER PROBLEMS.
    process.nextTick(() => {
        createOnlyOnce(obj);
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    process.nextTick(() => {
        createOnlyOnce(refObject);
    });
}

if (world.__isMock) {
    module.exports = { BuildAreaMat };
}
