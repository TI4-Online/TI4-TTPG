const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AutoRoller } = require("../objects/roller/auto-roller");
const { AutoRollerArena } = require("../objects/roller/auto-roller-arena");
const { BunkerSliceDraft } = require("../lib/draft/bunker2/bunker-slice-draft");
const {
    FrankenDraftSettings,
} = require("./tab-map/tab-draft/tab-franken/franken-settings");
const { GameSetup } = require("../setup/game-setup/game-setup");
const { MapTool } = require("./tab-map/tab-map-tool/map-tool");
const {
    MiltyEqSliceDraft,
} = require("../lib/draft/milty-eq2/milty-eq-slice-draft");
const { MiltySliceDraft } = require("../lib/draft/milty2/milty-slice-draft");
const { NavEntry } = require("../lib/ui/nav/nav-entry");
const { NavPanel } = require("../lib/ui/nav/nav-panel");
const { NavFolder } = require("../lib/ui/nav/nav-folder");
const { PremadeMap } = require("./tab-map/tab-premade/premade-map");
const { SCPT2022 } = require("./tab-map/tab-draft/tab-scpt/scpt-2022");
const {
    SCPT2022Invitational,
} = require("./tab-map/tab-draft/tab-scpt/scpt-2022-invitational");
const { SCPT2023 } = require("./tab-map/tab-draft/tab-scpt/scpt-2023");
const { TabAgenda } = require("./tab-agenda/tab-agenda");
const { TabBagDraft } = require("./tab-map/tab-draft/tab-bag/tab-bag");
const { TabDisplay } = require("./tab-display/tab-display");
const { TabFogOfWar } = require("./tab-map/tab-fog/tab-fog");
const { TabHelpUI } = require("./tab-help/tab-help-ui");
const { TableLayout } = require("../table/table-layout");
const {
    TabPlayerTimer,
} = require("./tab-stats/tab-player-timer/tab-player-timer");
const { TabSecrets } = require("./tab-stats/tab-secrets/tab-secrets");
const {
    TabSimpleStats,
} = require("./tab-stats/tab-simple-stats/tab-simple-stats");
const { TabStatus } = require("./tab-status/tab-status");
const { TabStreamer } = require("./tab-streamer/tab-streamer");
const { TabStrategy } = require("./tab-strategy/tab-strategy");
const { TabWhispers } = require("./tab-stats/tab-whispers/tab-whispers");
const { TurnOrderPanel } = require("../lib/ui/turn-order/turn-order-panel");
const { WekkerSliceDraft } = require("../lib/draft/wekker/wekker-slice-draft");
const { WidgetFactory } = require("../lib/ui/widget-factory");
const CONFIG = require("./game-ui-config");
const {
    Card,
    LayoutBox,
    Rotator,
    Text,
    Vector,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");
const { MaltyDraft } = require("../lib/draft/scpt/malty-draft");
const { SCPT2024 } = require("./tab-map/tab-draft/tab-scpt/scpt-2024");

let _gameUI;

/**
 * The "Savant", collected game UI and utilities organized into tabs.
 * This has grown rapidly, it deserves a user experience rethink.
 */
class GameUI {
    static getInstance() {
        if (!_gameUI) {
            _gameUI = new GameUI();
        }
        return _gameUI;
    }

    static isDev() {
        return refPackageId === "DEE44C689452447E8ED6FDDBEB19BB23";
    }

    static goHome() {
        const navPanel = GameUI.getInstance()._navPanel;
        const root = navPanel.getRootFolder();
        navPanel.setCurrentNavEntry(root);
    }

    constructor() {
        const anchor = TableLayout.anchor.gameUI;

        this._layout = WidgetFactory.layoutBox().setPadding(
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding,
            CONFIG.padding
        );

        const wrapper = WidgetFactory.border()
            .setColor(CONFIG.backgroundColor)
            .setChild(this._layout);
        const b = CONFIG.spacing / 2;
        const wrapperBox = WidgetFactory.layoutBox()
            .setPadding(b, b, b, b)
            .setChild(wrapper);
        const frame = WidgetFactory.border()
            .setColor(CONFIG.spacerColor)
            .setChild(wrapperBox);

        this._navPanel = undefined;
        this._strategyPhaseEntry = undefined;
        this._statusPhaseEntry = undefined;

        this._uiElement = WidgetFactory.uiElement();
        this._uiElement.scale = 1 / CONFIG.scale;
        this._uiElement.width = anchor.width * CONFIG.scale;
        this._uiElement.height = anchor.height * CONFIG.scale;
        this._uiElement.useWidgetSize = false;

        this._uiElement.position = new Vector(
            anchor.pos.x,
            anchor.pos.y,
            world.getTableHeight() + 0.2
        );
        this._uiElement.rotation = new Rotator(0, anchor.yaw, 0);
        this._uiElement.widget = frame;

        world.addUI(this._uiElement);

        globalEvents.TI4.onGameSetupPending.add(() => {
            // Remove UI while setup is happening.
            this._layout.setChild(new LayoutBox());
        });

        globalEvents.TI4.onGameSetup.add(() => {
            this.fill();
        });

        // Resetting scripting may orphan zones.
        this.destroyNopeZone();
        this.createNopeZone();
    }

    showStrategyPhase() {
        if (this._navPanel && this._strategyPhaseEntry) {
            this._navPanel.setCurrentNavEntry(this._strategyPhaseEntry);
        }
    }
    showStatusPhase() {
        if (this._navPanel && this._statusPhaseEntry) {
            this._navPanel.setCurrentNavEntry(this._statusPhaseEntry);
        }
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
            if (!(obj instanceof Card)) {
                return; // allow non-cards here
            }

            // Move to outside zone.
            const x = 25 + Math.random() * 5;
            const y = 70 + Math.random() * 5;
            const z = world.getTableHeight() + 20 + Math.random() * 3;
            const outside = new Vector(x, y, z);
            obj.setPosition(outside, 1);
        });
        zone.onEndOverlap.add((zone, obj) => {
            // nop
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
        WidgetFactory.setChild(this._layout, gameSetup.getUI());
    }

    fillForGame() {
        const panel = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );
        WidgetFactory.setChild(this._layout, panel);

        const turnOrderPanel = new TurnOrderPanel()
            .setFontSize(CONFIG.fontSize)
            .setSpacing(CONFIG.spacing)
            .setFitNameLength(13) // scale longer names
            .setAddEndTurnButton(true);
        this._navPanel = new NavPanel().startPeriodicUpdates();

        panel.addChild(this._navPanel.getWidget(), 4);
        panel.addChild(WidgetFactory.border().setColor(CONFIG.spacerColor));
        panel.addChild(turnOrderPanel.getWidget(), 1);

        this._navPanel.getWidget().__noMonkey = true;

        this.fillNavPanel(this._navPanel);
        this._navPanel.setCurrentNavEntry(this._navPanel.getRootFolder());
    }

    _createDraftFolder() {
        const draftFolder = new NavFolder().setName(locale("nav.map.draft"));

        const miltyDraftEntry = MiltySliceDraft.createDraftNavEntry();
        draftFolder.addChild(miltyDraftEntry);

        const miltyEqDraftEntry = MiltyEqSliceDraft.createDraftNavEntry();
        draftFolder.addChild(miltyEqDraftEntry);

        const bunkerDraftEntry = BunkerSliceDraft.createDraftNavEntry();
        draftFolder.addChild(bunkerDraftEntry);

        const wekkerDraftEntry = WekkerSliceDraft.createDraftNavEntry();
        draftFolder.addChild(wekkerDraftEntry);

        const scptFolder = new NavFolder().setName(
            locale("nav.map.draft.scpt")
        );
        draftFolder.addChild(scptFolder);

        const scpt2022 = new NavEntry()
            .setName("Patreon 4 (2022)")
            .setWidgetFactory((navPanel, navEntry) => {
                return new SCPT2022().getUI();
            });
        scptFolder.addChild(scpt2022);
        const scpt2022Invitatonal = new NavEntry()
            .setName("2022 Invitational")
            .setWidgetFactory((navPanel, navEntry) => {
                return new SCPT2022Invitational().getUI();
            });
        scptFolder.addChild(scpt2022Invitatonal);
        const scpt2023 = new NavEntry()
            .setName("Patreon 5 (2023)")
            .setWidgetFactory((navPanel, navEntry) => {
                return new SCPT2023().getUI();
            });
        scptFolder.addChild(scpt2023);
        const scpt2024 = new NavEntry()
            .setName("Patreon 6 (2024)")
            .setWidgetFactory((navPanel, navEntry) => {
                return new SCPT2024().getUI();
            });
        scptFolder.addChild(scpt2024);

        const bagDraft = new NavEntry()
            .setName(locale("nav.map.draft.bag"))
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabBagDraft().getUI();
            });
        draftFolder.addChild(bagDraft);

        const franken = new NavEntry()
            .setName(locale("nav.map.draft.franken"))
            .setIconPath("global/ui/icons/franken.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new FrankenDraftSettings().getUI();
            });
        draftFolder.addChild(franken);

        return draftFolder;
    }

    _createMapFolder() {
        const mapFolder = new NavFolder().setName(locale("nav.map"));

        const mapToolEntry = new NavEntry()
            .setName(locale("nav.map.maptool"))
            .setIconPath("global/ui/icons/hex.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new MapTool().getUI();
            });
        mapFolder.addChild(mapToolEntry);

        const premadeMapsEntry = new NavEntry()
            .setName(locale("nav.map.premade"))
            .setIconPath("global/ui/icons/filter.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new PremadeMap().getUI();
            });
        mapFolder.addChild(premadeMapsEntry);

        const draftFolder = this._createDraftFolder();
        mapFolder.addChild(draftFolder);

        const factionBordersEntry = new NavEntry()
            .setName(locale("nav.map.borders"))
            .setIconPath("global/ui/icons/settings_application.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setText("moved to Root > Display");
            });
        mapFolder.addChild(factionBordersEntry);

        const fogOfWarEntry = new NavEntry()
            .setName(locale("nav.map.fog"))
            .setIconPath("global/ui/icons/lens_blur.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabFogOfWar().getUI();
            });
        mapFolder.addChild(fogOfWarEntry);

        return mapFolder;
    }

    _createActionPhaseFolder(navPanel) {
        assert(navPanel instanceof NavPanel);

        const actionPhaseFolder = new NavFolder().setName(
            locale("nav.action_phase")
        );

        const autoRoller = new AutoRoller(); // adds event handlers, reuse one instance
        const autoRollerEntry = new NavEntry()
            .setName(locale("nav.autoroller"))
            .setIconPath("global/ui/icons/d6.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return autoRoller.getUI();
            })
            .setPersistWidget(true);
        autoRollerEntry.onShow.add(() => {
            AutoRollerArena.createArenaPlatform();
        });
        autoRollerEntry.onHide.add(() => {
            AutoRollerArena.destroyArenaPlatform();
        });
        actionPhaseFolder.addChild(autoRollerEntry);
        globalEvents.TI4.onSystemActivated.add((systemTileObj, player) => {
            navPanel.setCurrentNavEntry(autoRollerEntry);
        });

        return actionPhaseFolder;
    }

    _createStatsFolder() {
        const statsFolder = new NavFolder().setName(locale("nav.stats"));

        const tabStatsEntry = new NavEntry()
            .setName(locale("nav.stats.simple"))
            .setWidgetFactory((navPanel, navEntry) => {
                const tabStats = new TabSimpleStats();
                navEntry.__tabStats = tabStats; // store reference to release
                return tabStats.getUI();
            })
            .setPeriodicUpdateWidget((navEntry) => {
                const tabStats = navEntry.__tabStats;
                assert(tabStats);
                tabStats.updateUI();
            })
            .setDestroyWidget((navEntry) => {
                navEntry.__tabStats = undefined; // release for GC
            });

        statsFolder.addChild(tabStatsEntry);

        const tabWhispersEntry = new NavEntry()
            .setName(locale("nav.stats.whispers"))
            .setWidgetFactory((navPanel, navEntry) => {
                const tabWhispers = new TabWhispers();
                navEntry.__tabWhispers = tabWhispers; // store reference to release
                return tabWhispers.getUI();
            })
            .setPeriodicUpdateWidget((navEntry) => {
                const tabWhispers = navEntry.__tabWhispers;
                assert(tabWhispers);
                tabWhispers.updateUI();
            })
            .setDestroyWidget((navEntry) => {
                navEntry.__tabWhispers = undefined; // release for GC
            });
        statsFolder.addChild(tabWhispersEntry);

        const tabSecretsEntry = new NavEntry()
            .setName(locale("nav.stats.secrets"))
            .setWidgetFactory((navPanel, navEntry) => {
                const tabSecrets = new TabSecrets();
                navEntry.__tabSecrets = tabSecrets; // store reference to release
                return tabSecrets.getUI();
            })
            .setPeriodicUpdateWidget((navEntry) => {
                const tabSecrets = navEntry.__tabSecrets;
                assert(tabSecrets);
                tabSecrets.updateUI();
            })
            .setDestroyWidget((navEntry) => {
                navEntry.__tabSecrets = undefined; // release for GC
            });
        statsFolder.addChild(tabSecretsEntry);

        const tabPlayerTimerEntry = new NavEntry()
            .setName(locale("nav.stats.player_timer"))
            .setWidgetFactory((navPanel, navEntry) => {
                const tabPlayerTimer = new TabPlayerTimer();
                navEntry.__tabPlayerTimer = tabPlayerTimer; // store reference to release
                return tabPlayerTimer.getUI();
            })
            .setPeriodicUpdateWidget((navEntry) => {
                const tabPlayerTimer = navEntry.__tabPlayerTimer;
                assert(tabPlayerTimer);
                tabPlayerTimer.updateUI();
            })
            .setDestroyWidget((navEntry) => {
                navEntry.__tabPlayerTimer = undefined; // release for GC
            });
        statsFolder.addChild(tabPlayerTimerEntry);

        return statsFolder;
    }

    fillNavPanel(navPanel) {
        assert(navPanel instanceof NavPanel);
        const rootFolder = navPanel.getRootFolder();

        // Help.
        const helpEntry = new NavEntry()
            .setName(locale("nav.help"))
            .setIconPath("global/ui/icons/help.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabHelpUI().getWidget();
            });
        rootFolder.addChild(helpEntry);

        // Map.
        const mapFolder = this._createMapFolder();
        rootFolder.addChild(mapFolder);

        // Phases.
        this._strategyPhaseEntry = new NavEntry()
            .setName(locale("nav.strategy_phase"))
            .setIconPath("global/ui/icons/not_started.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabStrategy().getUI();
            });
        rootFolder.addChild(this._strategyPhaseEntry);
        // Comment this out for now.  Switch to the strategy phase panel?
        // This triggers for status phase cleanup too, not ideal.
        // globalEvents.TI4.onStrategyCardMovementStopped.add(() => {
        //     console.log("GameUI: onStrategyCardMovementStopped");
        //     // How shall we test if this is the stragey phase?
        //     // If enough strategy cards are unpicked assume picking now.
        //     const unpickedStrategyCards =
        //         PlaceTradegoodUnpicked.getUnpickedStrategyCards();
        //     if (unpickedStrategyCards.length >= 6) {
        //         navPanel.setCurrentNavEntry(this._strategyPhaseEntry);
        //     }
        // });

        const actionPhaseFolder = this._createActionPhaseFolder(navPanel);
        rootFolder.addChild(actionPhaseFolder);

        this._statusPhaseEntry = new NavEntry()
            .setName(locale("nav.status_phase"))
            .setIconPath("global/ui/icons/cleaning_services.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabStatus().getUI();
            });
        rootFolder.addChild(this._statusPhaseEntry);
        globalEvents.TI4.onTurnOrderEmpty.add(() => {
            if (world.TI4.agenda.isActive()) {
                return; // agenda phase, ignore all have passed
            }
            // All players have passed, probably the action phase (?).
            navPanel.setCurrentNavEntry(this._statusPhaseEntry);
        });

        const tabAgenda = new TabAgenda(); // registers event handler, reuse
        const agendaPhaseEntry = new NavEntry()
            .setName(locale("nav.agenda_phase"))
            .setIconPath("global/ui/icons/ballot.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return tabAgenda.getUI();
            })
            .setPersistWidget(true);
        rootFolder.addChild(agendaPhaseEntry);
        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            if (agendaCard) {
                navPanel.setCurrentNavEntry(agendaPhaseEntry);
            }
        });

        const displayEntry = new NavEntry()
            .setName(locale("nav.display"))
            .setIconPath("global/ui/icons/settings_application.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabDisplay().getWidget();
            });
        rootFolder.addChild(displayEntry);

        const statsFolder = this._createStatsFolder();
        rootFolder.addChild(statsFolder);

        const streamerEntry = new NavEntry()
            .setName(locale("nav.streamer"))
            .setIconPath("global/ui/icons/video_camera.png")
            .setWidgetFactory((navPanel, navEntry) => {
                return new TabStreamer().getUI();
            });
        rootFolder.addChild(streamerEntry);
    }
}

GameUI.getInstance(); // create even if mock

if (!world.__isMock) {
    process.nextTick(() => {
        GameUI.getInstance().fill();
    });
}

module.exports = { GameUI };
