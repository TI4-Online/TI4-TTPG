/**
 * Attach Game UI to world.
 */
const locale = require("../lib/locale");
const { GameSetup } = require("../setup/game-setup/game-setup");
const { TabAction } = require("./tab-action/tab-action");
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
    Text,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

class GameUI {
    constructor() {
        const anchor = TableLayout.anchor.gameUI;

        this._layout = new LayoutBox().setPadding(
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding
        );
        //.setMinimumWidth(anchor.width)
        //.setMinimumHeight(anchor.height);

        this._uiElement = new UIElement();
        this._uiElement.width = anchor.width;
        this._uiElement.height = anchor.height;
        this._uiElement.useWidgetSize = false;

        this._uiElement.position = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 0.01
        );
        this._uiElement.rotation = new Rotator(0, anchor.yaw, 0);
        this._uiElement.widget = new Border().setChild(this._layout);

        this._doRefresh = () => {
            world.updateUI(this._uiElement);
        };

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

        const zonePos = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 1
        );
        const zoneRot = new Rotator(0, anchor.yaw, 0);
        const zoneScale = new Vector(anchor.height / 10, anchor.width / 10, 2);
        const zone = world.createZone(zonePos);
        zone.setSavedData("game-ui-nope-zone");
        zone.setRotation(zoneRot);
        zone.setScale(zoneScale);
        zone.setColor([1, 0, 0, 0.2]);
        zone.setAlwaysVisible(false);
        zone.onBeginOverlap.add((zone, obj) => {
            //console.log("onBeginOverlap");

            const above = obj.getPosition().add([0, 0, 10]);
            obj.setPosition(above);

            const container = undefined;
            const rejectedObjs = [obj];
            const player = undefined;
            globalEvents.TI4.onContainerRejected.trigger(
                container,
                rejectedObjs,
                player
            );
        });
        zone.onEndOverlap.add((zone, obj) => {
            //console.log("onEndOverlap");
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
        panel.addChild(tabbedPanel, 4);

        // Line between main UI and turn order.
        panel.addChild(new Border().setColor(CONFIG.spacerColor));

        const turnOrderPanel = new TurnOrderPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing);
        panel.addChild(turnOrderPanel, 1);

        const tabHelp = new TabHelpUI();
        tabbedPanel.addTab(locale("ui.tab.help"), tabHelp, true);

        const tabMap = new TabMap(this._doRefresh);
        tabbedPanel.addTab(locale("ui.tab.map"), tabMap.getUI());

        const tabStrategy = new TabStrategy();
        tabbedPanel.addTab(
            locale("ui.tab.strategy_phase"),
            tabStrategy.getUI()
        );

        const tabAction = new TabAction(this._doRefresh);
        tabbedPanel.addTab(locale("ui.tab.action_phase"), tabAction.getUI());

        const tabStatus = new TabStatus();
        tabbedPanel.addTab(locale("ui.tab.status_phase"), tabStatus.getUI());

        //.addTab(locale("ui.tab.auto_roller"), autoRoller.getUI())

        tabbedPanel.addTab(
            locale("ui.tab.agenda_phase"),
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText("< work in progress >")
        );
    }
}

const gameUI = new GameUI();

if (!world.__isMock) {
    process.nextTick(() => {
        gameUI.fill();
    });
}
