const locale = require("../lib/locale");
const { GameSetup } = require("../setup/game-setup/game-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { TabAction } = require("./tab-action/tab-action");
const { TabAgenda } = require("./tab-agenda/tab-agenda");
const { TabbedPanel } = require("../lib/ui/tabbed-panel");
const { TabHelpUI } = require("./tab-help/tab-help-ui");
const { TableLayout } = require("../table/table-layout");
const { TabMap } = require("./tab-map/tab-map");
const { TabStrategy } = require("./tab-strategy/tab-strategy");
const { TabStatus } = require("./tab-status/tab-status");
const { TurnOrderPanel } = require("../lib/ui/turn-order-panel");
const CONFIG = require("./game-ui-config");
const {
    Border,
    HorizontalBox,
    LayoutBox,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

/**
 * The "Savant", collected game UI and utilities organized into tabs.
 * This has grown rapidly, it deserves a user experience rethink.
 */
class GameUI {
    constructor() {
        const anchor = TableLayout.anchor.gameUI;

        this._layout = new LayoutBox().setPadding(
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding
        );

        this._uiElement = new UIElement();
        this._uiElement.scale = 1 / CONFIG.scale;
        this._uiElement.width = anchor.width * CONFIG.scale;
        this._uiElement.height = anchor.height * CONFIG.scale;
        this._uiElement.useWidgetSize = false;

        this._uiElement.position = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 0.01
        );
        this._uiElement.rotation = new Rotator(0, anchor.yaw, 0);
        this._uiElement.widget = new Border().setChild(this._layout);

        world.addUI(this._uiElement);

        globalEvents.TI4.onGameSetup.add(() => {
            this.fill();
        });

        // Resetting scripting may orphan zones.
        this.destroyNopeZone();
        this.createNopeZone();
    }

    destroyNopeZone() {
        for (const zone of world.getAllZones()) {
            if (zone.getSavedData() === "game-ui-nope-zone") {
                zone.destroy();
            }
        }
    }

    /**
     * Create a zone to keep objects from laying atop.
        // A card on the UI can't be picked up without selection drag
        // b/c UI takes pointer.
     */
    createNopeZone() {
        const anchor = TableLayout.anchor.gameUI;

        const zoneHeight = 0.5;
        const zonePos = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + zoneHeight / 2
        );
        const zoneRot = new Rotator(0, anchor.yaw, 0);
        const zoneScale = new Vector(
            anchor.height / 10,
            anchor.width / 10,
            zoneHeight
        );
        const zone = world.createZone(zonePos);
        zone.setSavedData("game-ui-nope-zone");
        zone.setRotation(zoneRot);
        zone.setScale(zoneScale);
        zone.setColor([1, 0, 0, 0.2]);
        zone.setAlwaysVisible(false);
        zone.onBeginOverlap.add((zone, obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            console.log(`GameUI.onBeginOverlap: "${nsid}"`);

            // Move to outside zone.
            const x = 25 + Math.random() * 5;
            const y = 70 + Math.random() * 5;
            const z = world.getTableHeight() + 20 + Math.random() * 3;
            const outside = new Vector(x, y, z);
            obj.setPosition(outside, 1);
        });
        zone.onEndOverlap.add((zone, obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            console.log(`GameUI.onEndOverlap: "${nsid}"`);
        });
    }

    fill() {
        if (world.TI4.config.timestamp <= 0) {
            this.fillForSetup();
        } else {
            this.fillForGame();
        }
    }

    fillForSetup() {
        const gameSetup = new GameSetup();
        this._layout.setChild(gameSetup.getUI());
    }

    fillForGame() {
        const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this._layout.setChild(panel);

        const tabbedPanel = new TabbedPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        const turnOrderPanel = new TurnOrderPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);

        // Line between main UI and turn order.
        panel.addChild(turnOrderPanel, 1);
        panel.addChild(new Border().setColor(CONFIG.spacerColor));
        panel.addChild(tabbedPanel, 4);

        const tabHelp = new TabHelpUI();
        tabbedPanel.addTab(locale("ui.tab.help"), tabHelp, true);

        const tabMap = new TabMap();
        tabbedPanel.addTab(locale("ui.tab.map"), tabMap.getUI());

        const tabStrategy = new TabStrategy();
        tabbedPanel.addTab(
            locale("ui.tab.strategy_phase"),
            tabStrategy.getUI()
        );

        const tabAction = new TabAction();
        tabbedPanel.addTab(locale("ui.tab.action_phase"), tabAction.getUI());

        const tabStatus = new TabStatus();
        tabbedPanel.addTab(locale("ui.tab.status_phase"), tabStatus.getUI());

        const tabAgenda = new TabAgenda();
        tabbedPanel.addTab(locale("ui.tab.agenda_phase"), tabAgenda.getUI());

        globalEvents.TI4.onSystemActivated.add((systemTileObj, player) => {
            tabbedPanel.selectTab(locale("ui.tab.action_phase"));
        });
        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            if (agendaCard) {
                tabbedPanel.selectTab(locale("ui.tab.agenda_phase"));
            }
        });
    }
}

const gameUI = new GameUI();

if (!world.__isMock) {
    process.nextTick(() => {
        gameUI.fill();
    });
}
