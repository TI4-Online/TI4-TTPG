const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Hex } = require("../../lib/hex");
const { System, Planet } = require("../../lib/system/system");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
    world,
} = require("../../wrapper/api");

const COMBAT_TYPE = {
    FINISH_MOVE: "finishMove",
    SPACE_CANNON: "spaceCannon",
    AMBUSH: "ambush",
    ANTI_FIGHTER_BARRAGE: "antiFighterBarrage",
    ANNOUNCE_RETREAT: "announceRetreat",
    SPACE_COMBAT: "spaceCombat",
    PRODUCTION: "production",
    BOMBARDMENT: "bombardment",
    GROUND_COMBAT: "groundCombat",
    REPORT_MODIFIERS: "reportModifiers",
};

const VERTICAL_DISTANCE = 5 * CONFIG.scale;
const LABEL_FONT = "Handel_Gothic_Regular.otf";
const LABEL_FONT_SIZE = 14 * CONFIG.scale;
const LABEL_WEIGHT = 0;
const BUTTON_FONT_SIZE = 12 * CONFIG.scale;
const BUTTON_WEIGHT = 1;
const GAP_WEIGHT = 0;

/**
 * Manage the UI on an AutoRoller object.
 */
class AutoRollerUI extends HorizontalBox {
    /**
     * Returns true if the active player, or a player with ships in the system
     * has the faction ability ambush.
     *
     * Does not check if the player with ambush has destroyers or cruisers in
     * the system because this is called on activation and the active player
     * will likely have not moved units into the system yet.
     *
     * @param {System} system
     * @return {boolean}
     */
    static _ambush(system) {
        const activeSlot = world.TI4.turns.getCurrentTurn().playerSlot;
        const activeFaction = world.TI4.getFactionByPlayerSlot(activeSlot);
        if (activeFaction && activeFaction.raw.abilities.includes("ambush")) {
            return true;
        }

        const systemObj = world.TI4.getAllSystemTileObjects().filter(
            (obj) =>
                world.TI4.getSystemBySystemTileObject(obj).tile === system.tile
        )[0];
        if (!systemObj) {
            return false; // should only happen during testing
        }
        const systemHex = Hex.fromPosition(systemObj.getPosition());
        const systemPlastic = UnitPlastic.getAll().filter(
            (plastic) => plastic.hex === systemHex
        );

        for (var i = 0; i < systemPlastic.length; i++) {
            const playerSlot = systemPlastic[i].owningPlayerSlot;
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            if (faction && faction.raw.abilities.includes("ambush")) {
                return true;
            }
        }
    }

    /**
     * Constructor.
     *
     * @param {function} onButton - called with (rollType: string, planet: Planet or false, player: Player)
     */
    constructor(onButton) {
        assert(onButton);
        super();
        this._onButton = onButton;

        this._stepsPanel = new VerticalBox()
            .setChildDistance(VERTICAL_DISTANCE)
            .setVerticalAlignment(VerticalAlignment.Fill);
        this._invasionPanel = new VerticalBox().setChildDistance(
            VERTICAL_DISTANCE
        );
        const arenaPanel = new VerticalBox().setChildDistance(
            VERTICAL_DISTANCE
        );

        // Divide arena panel up.
        this._arenaBox = new LayoutBox();
        this._arenaLowerLeft = new VerticalBox().setChildDistance(
            VERTICAL_DISTANCE
        );
        const arenaLowerRight = new LayoutBox();
        const arenaLower = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._arenaLowerLeft, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(arenaLowerRight, 1);
        const localeText = "ui.roller.report_modifiers";
        const combatType = COMBAT_TYPE.REPORT_MODIFIERS;
        const widget = this._createButton(localeText, combatType);
        arenaLowerRight.setChild(widget);
        arenaPanel.addChild(this._arenaBox, 9);
        arenaPanel.addChild(arenaLower, 3);

        this.setChildDistance(CONFIG.spacing)
            .addChild(this._stepsPanel, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(this._invasionPanel, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(arenaPanel, 2);

        this.resetAwaitingSystemActivation();

        // Leave this for testing (commented out)
        //const system = world.TI4.getSystemByTileNumber(18);
        //this._fillStepsPanel(system);
        //this._fillInvasionPanel(system);
        //this._fillArenaPanel(system);
    }

    _createLabel(localeText) {
        assert(typeof localeText === "string");
        const label = new Text()
            .setFontSize(LABEL_FONT_SIZE)
            .setFont(LABEL_FONT, refPackageId)
            .setJustification(TextJustification.Center)
            .setText(locale(localeText).toUpperCase());
        return label;
    }

    _createPlanetLabel(planetName) {
        assert(typeof planetName === "string");
        const label = new Text()
            .setFontSize(LABEL_FONT_SIZE)
            .setJustification(TextJustification.Center)
            .setItalic(true)
            .setText(locale(planetName).toUpperCase());
        return label;
    }

    _createButton(localeText, combatType, planet) {
        assert(typeof localeText === "string");
        assert(typeof combatType === "string");
        assert(!planet || planet instanceof Planet);
        const button = new Button()
            .setFontSize(BUTTON_FONT_SIZE)
            .setText(locale(localeText));
        button.onClicked.add((button, player) => {
            this._onButton(combatType, planet, player);
        });
        return button;
    }

    _createGap() {
        return new LayoutBox().setOverrideHeight(VERTICAL_DISTANCE);
    }

    _fillStepsPanel(system) {
        assert(system instanceof System);

        this._stepsPanel.removeAllChildren();

        let localeText;
        let combatType;
        let widget;

        // MOVEMENT STEP
        localeText = "ui.label.movement";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        localeText = "ui.movement.finish_movement";
        combatType = COMBAT_TYPE.FINISH_MOVE;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        localeText = "ui.roller.space_cannon_offense";
        combatType = COMBAT_TYPE.SPACE_CANNON;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        // GAP
        widget = this._createGap();
        this._stepsPanel.addChild(widget, GAP_WEIGHT);

        // SPACE COMBAT STEP
        localeText = "ui.label.space_combat";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        const ambushAvailable = AutoRollerUI._ambush(system);
        if (ambushAvailable) {
            localeText = "ui.roller.ambush";
            combatType = COMBAT_TYPE.AMBUSH;
            widget = this._createButton(localeText, combatType);
            this._stepsPanel.addChild(widget, BUTTON_WEIGHT);
        }

        localeText = "ui.roller.anti_fighter_barrage";
        combatType = COMBAT_TYPE.ANTI_FIGHTER_BARRAGE;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        localeText = "ui.roller.announce_retreat";
        combatType = COMBAT_TYPE.ANNOUNCE_RETREAT;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        localeText = "ui.roller.space_combat";
        combatType = COMBAT_TYPE.SPACE_COMBAT;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        // GAP
        widget = this._createGap();
        this._stepsPanel.addChild(widget, GAP_WEIGHT);

        // INVASION (redirect)
        localeText = "ui.label.invasion";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        localeText = "->";
        combatType = "n/a";
        widget = this._createButton(localeText, combatType);
        widget.setEnabled(false);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);

        // GAP
        widget = this._createGap();
        this._stepsPanel.addChild(widget, GAP_WEIGHT);

        // PRODUCTION
        localeText = "ui.label.production";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        localeText = "ui.label.production";
        combatType = COMBAT_TYPE.PRODUCTION;
        widget = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(widget, BUTTON_WEIGHT);
    }

    _fillInvasionPanel(system) {
        assert(system instanceof System);

        this._invasionPanel.removeAllChildren();

        let localeText;
        let combatType;
        let widget;

        // Always create 3 (but allow more!) for consistent sizing.
        const numPlanetPanels = Math.max(3, system.planets.length);
        const planetPanels = new Array(numPlanetPanels).fill(0).map(() => {
            const panel = new VerticalBox().setChildDistance(VERTICAL_DISTANCE);
            this._invasionPanel.addChild(panel, 4);
            return panel;
        });

        system.planets.forEach((planet, index) => {
            const panelIndex = 3 - system.planets.length + index;
            const panel = planetPanels[panelIndex];

            const planetName = planet.getNameStr();
            widget = this._createPlanetLabel(planetName);
            panel.addChild(widget, LABEL_WEIGHT);

            localeText = "ui.roller.bombardment";
            combatType = COMBAT_TYPE.BOMBARDMENT;
            widget = this._createButton(localeText, combatType, planet);
            panel.addChild(widget, BUTTON_WEIGHT);

            localeText = "ui.roller.space_cannon_defense";
            combatType = COMBAT_TYPE.SPACE_CANNON;
            widget = this._createButton(localeText, combatType, planet);
            panel.addChild(widget, BUTTON_WEIGHT);

            localeText = "ui.roller.ground_combat";
            combatType = COMBAT_TYPE.GROUND_COMBAT;
            widget = this._createButton(localeText, combatType, planet);
            panel.addChild(widget, BUTTON_WEIGHT);
        });
    }

    _fillArenaPanel(system) {
        assert(system instanceof System);

        this._arenaBox.setChild(undefined);
        this._arenaLowerLeft.removeAllChildren();

        // XXX TODO
    }

    /**
     * Reset for "no system activated".
     */
    resetAwaitingSystemActivation() {
        this._stepsPanel.removeAllChildren();
        this._invasionPanel.removeAllChildren();
        this._arenaBox.setChild(undefined);
        this._arenaLowerLeft.removeAllChildren();

        const message = new Text()
            .setAutoWrap(true)
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.message.no_system_activated"));

        this._stepsPanel.addChild(message);
    }

    /**
     * Reset for the given system.
     *
     * Get localized planet names by: `system.planets[].getNameStr()`
     *
     * To test with a system get one via `world.TI4.getSystemByTileNumber(#)`.
     *
     * @param {System} system
     */
    resetAfterSystemActivation(system) {
        assert(system instanceof System);

        this._fillStepsPanel(system);
        this._fillInvasionPanel(system);
        this._fillArena(system);
    }
}

module.exports = { AutoRollerUI };
