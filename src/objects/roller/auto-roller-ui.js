const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AutoRollerArena } = require("./auto-roller-arena");
const { ColorUtil } = require("../../lib/color/color-util");
const { Hex } = require("../../lib/hex");
const { System, Planet } = require("../../lib/system/system");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    HorizontalAlignment,
    HorizontalBox,
    ImageWidget,
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
const LABEL_FONT = "handel-gothic-regular.ttf";
const LABEL_FONT_SIZE = 14 * CONFIG.scale;
const LABEL_WEIGHT = 0;
const BUTTON_FONT_SIZE = 12 * CONFIG.scale;
const BUTTON_WEIGHT = 1;
const GAP_WEIGHT = 0;
const HELP_FONT_SIZE = 11 * CONFIG.scale;

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
        const systemPlastic = world.TI4.getAllUnitPlastics().filter(
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

        this._createAndLayoutStepsPanel();
        this._createAndLayoutInvasionPanel();
        this._createAndLayoutArenaPanel();

        this.setChildDistance(CONFIG.spacing)
            .addChild(this._stepsPanel, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(this._invasionPanel, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(this._arenaPanel, 2);

        this.resetAwaitingSystemActivation();

        // Leave this for testing (commented out) 58 is three planet system
        //const system = world.TI4.getSystemByTileNumber(58);
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
        button.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._onButton(combatType, planet, player);
            })
        );
        return button;
    }

    _createGap() {
        return new LayoutBox().setOverrideHeight(VERTICAL_DISTANCE);
    }

    _createAndLayoutStepsPanel() {
        assert(!this._stepsPanel);
        this._stepsPanel = new VerticalBox()
            .setChildDistance(VERTICAL_DISTANCE)
            .setVerticalAlignment(VerticalAlignment.Fill);

        let localeText;
        let combatType;
        let widget;

        // MOVEMENT STEP
        localeText = "ui.label.movement";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        localeText = "ui.movement.finish_movement";
        combatType = COMBAT_TYPE.FINISH_MOVE;
        this._stepsFinishMove = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(this._stepsFinishMove, BUTTON_WEIGHT);

        localeText = "ui.roller.space_cannon_offense";
        combatType = COMBAT_TYPE.SPACE_CANNON;
        this._stepsSpaceCannonOffense = this._createButton(
            localeText,
            combatType
        );
        this._stepsPanel.addChild(this._stepsSpaceCannonOffense, BUTTON_WEIGHT);

        // GAP
        widget = this._createGap();
        this._stepsPanel.addChild(widget, GAP_WEIGHT);

        // SPACE COMBAT STEP
        localeText = "ui.label.space_combat";
        widget = this._createLabel(localeText);
        this._stepsPanel.addChild(widget, LABEL_WEIGHT);

        localeText = "ui.roller.ambush";
        combatType = COMBAT_TYPE.AMBUSH;
        this._stepsAmbush = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(this._stepsAmbush, BUTTON_WEIGHT);

        localeText = "ui.roller.anti_fighter_barrage";
        combatType = COMBAT_TYPE.ANTI_FIGHTER_BARRAGE;
        this._stepsAntiFighterBarrage = this._createButton(
            localeText,
            combatType
        );
        this._stepsPanel.addChild(this._stepsAntiFighterBarrage, BUTTON_WEIGHT);

        localeText = "ui.roller.announce_retreat";
        combatType = COMBAT_TYPE.ANNOUNCE_RETREAT;
        this._stepsAnnounceRetreat = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(this._stepsAnnounceRetreat, BUTTON_WEIGHT);

        localeText = "ui.roller.space_combat";
        combatType = COMBAT_TYPE.SPACE_COMBAT;
        this._stepsSpaceCombat = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(this._stepsSpaceCombat, BUTTON_WEIGHT);

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
        this._stepsProduction = this._createButton(localeText, combatType);
        this._stepsPanel.addChild(this._stepsProduction, BUTTON_WEIGHT);
    }

    _fillStepsPanel(system) {
        assert(!system || system instanceof System);

        const enabled = system ? true : false;
        this._stepsFinishMove.setEnabled(enabled);
        this._stepsSpaceCannonOffense.setEnabled(enabled);
        this._stepsAmbush.setEnabled(enabled);
        this._stepsAntiFighterBarrage.setEnabled(enabled);
        this._stepsAnnounceRetreat.setEnabled(enabled);
        this._stepsSpaceCombat.setEnabled(enabled);
        this._stepsProduction.setEnabled(enabled);

        const ambushAvailable = system && AutoRollerUI._ambush(system);
        this._stepsAmbush.setEnabled(ambushAvailable);
    }

    _createAndLayoutInvasionPanel() {
        assert(!this._invasionPanel);

        this._invasionPanel = new VerticalBox()
            .setChildDistance(VERTICAL_DISTANCE)
            .setVerticalAlignment(VerticalAlignment.Fill);

        let localeText;
        let combatType;

        const createInvasionPlanet = () => {
            const label = this._createPlanetLabel("?");
            this._invasionPanel.addChild(label, LABEL_WEIGHT);

            localeText = "ui.roller.bombardment";
            combatType = COMBAT_TYPE.BOMBARDMENT;
            const bombardment = this._createButton(localeText, combatType);
            this._invasionPanel.addChild(bombardment, BUTTON_WEIGHT);

            localeText = "ui.roller.space_cannon_defense";
            combatType = COMBAT_TYPE.SPACE_CANNON;
            const spaceCannonDefense = this._createButton(
                localeText,
                combatType
            );
            this._invasionPanel.addChild(spaceCannonDefense, BUTTON_WEIGHT);

            localeText = "ui.roller.ground_combat";
            combatType = COMBAT_TYPE.GROUND_COMBAT;
            const groundCombat = this._createButton(localeText, combatType);
            this._invasionPanel.addChild(groundCombat, BUTTON_WEIGHT);

            return {
                label,
                bombardment,
                spaceCannonDefense,
                groundCombat,
            };
        };

        this._invasionPlanets = [];

        for (let i = 0; i < 3; i++) {
            const subPanel = createInvasionPlanet();
            this._invasionPlanets.push(subPanel);
            if (i < 2) {
                const widget = this._createGap();
                this._invasionPanel.addChild(widget, GAP_WEIGHT);
            }
        }
    }

    _fillInvasionPanel(system) {
        assert(!system || system instanceof System);

        for (const invasionPlanet of this._invasionPlanets) {
            invasionPlanet.label.setText("-");
            invasionPlanet.bombardment.setEnabled(false);
            invasionPlanet.spaceCannonDefense.setEnabled(false);
            invasionPlanet.groundCombat.setEnabled(false);
        }

        const planets = system ? system.planets : [];
        let combatType;
        planets.forEach((planet, index) => {
            if (index >= this._invasionPlanets.length) {
                return; // only support 3 planets
            }
            const invasionPlanet = this._invasionPlanets[index];
            assert(invasionPlanet);

            const planetName = planet.getNameStr();
            invasionPlanet.label.setText(planetName);

            combatType = COMBAT_TYPE.BOMBARDMENT;
            invasionPlanet.bombardment.onClicked.clear();
            invasionPlanet.bombardment.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    this._onButton(combatType, planet, player);
                })
            );
            invasionPlanet.bombardment.setEnabled(true);

            combatType = COMBAT_TYPE.SPACE_CANNON;
            invasionPlanet.spaceCannonDefense.onClicked.clear();
            invasionPlanet.spaceCannonDefense.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    this._onButton(combatType, planet, player);
                })
            );
            invasionPlanet.spaceCannonDefense.setEnabled(true);

            combatType = COMBAT_TYPE.GROUND_COMBAT;
            invasionPlanet.groundCombat.onClicked.clear();
            invasionPlanet.groundCombat.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    this._onButton(combatType, planet, player);
                })
            );
            invasionPlanet.groundCombat.setEnabled(true);
        });
    }

    _createAndLayoutArenaPanel() {
        assert(!this._arenaPanel);
        this._arenaPanel = new VerticalBox()
            .setChildDistance(VERTICAL_DISTANCE)
            .setVerticalAlignment(VerticalAlignment.Fill);

        // Divide arena panel up.
        this._arenaBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center);
        const arenaBoxBorder = new Border()
            .setColor(ColorUtil.colorFromHex("#101010"))
            .setChild(this._arenaBox);
        this._arenaLowerLeft = new VerticalBox().setChildDistance(
            VERTICAL_DISTANCE
        );
        const arenaLowerRight = new VerticalBox();
        const arenaLower = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._arenaLowerLeft, 1)
            .addChild(new Border().setColor(CONFIG.spacerColor))
            .addChild(arenaLowerRight, 1);
        this._arenaPanel.addChild(arenaBoxBorder, 9);
        this._arenaPanel.addChild(arenaLower, 3);

        arenaLowerRight
            .addChild(
                new Text()
                    .setFontSize(HELP_FONT_SIZE)
                    .setText(locale("ui.help.numpad"))
            )
            .addChild(
                new Text()
                    .setFontSize(HELP_FONT_SIZE)
                    .setText(locale("ui.help.numpad.4"))
            )
            .addChild(
                new Text()
                    .setFontSize(HELP_FONT_SIZE)
                    .setText(locale("ui.help.numpad.5"))
            )
            .addChild(
                new Text()
                    .setFontSize(HELP_FONT_SIZE)
                    .setText(locale("ui.help.numpad.9"))
            )
            .addChild(
                new Text()
                    .setFontSize(HELP_FONT_SIZE)
                    .setText(locale("ui.help.numpad.0"))
            );

        let localeText;
        let combatType;
        let widget;

        localeText = "ui.roller.warp_in";
        combatType = "n/a";
        this._arenaWarpIn = this._createButton(localeText, combatType);
        this._arenaWarpIn.onClicked.clear();
        this._arenaWarpIn.onClicked.add((button, player) => {
            AutoRollerArena.warpIn();
        });
        this._arenaLowerLeft.addChild(this._arenaWarpIn, BUTTON_WEIGHT);

        localeText = "ui.roller.warp_out";
        combatType = "n/a";
        this._arenaWarpOut = this._createButton(localeText, combatType);
        this._arenaWarpOut.onClicked.clear();
        this._arenaWarpOut.onClicked.add((button, player) => {
            AutoRollerArena.warpOut();
        });
        this._arenaLowerLeft.addChild(this._arenaWarpOut, BUTTON_WEIGHT);

        localeText = "ui.roller.report_modifiers";
        combatType = COMBAT_TYPE.REPORT_MODIFIERS;
        widget = this._createButton(localeText, combatType);
        this._arenaLowerLeft.addChild(widget, BUTTON_WEIGHT);

        const size = CONFIG.scale * 340;
        this._systemImage = new ImageWidget().setImageSize(size, size);
        this._arenaBox.setChild(this._systemImage);
    }

    _fillArenaPanel(system) {
        assert(!system || system instanceof System);

        const enabled = system ? true : false;
        this._arenaWarpIn.setEnabled(enabled);
        this._arenaWarpOut.setEnabled(enabled);

        const imgPath = system ? system.raw.img : "global/ui/tiles/blank.png";
        const tint = system ? [1, 1, 1, 1] : [0.1, 0.1, 0.1, 1];
        this._systemImage.setImage(imgPath, refPackageId);
        this._systemImage.setTintColor(tint);
    }

    /**
     * Reset for "no system activated".
     */
    resetAwaitingSystemActivation() {
        this._fillStepsPanel(undefined);
        this._fillInvasionPanel(undefined);
        this._fillArenaPanel(undefined);
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
        this._fillArenaPanel(system);
    }
}

module.exports = { AutoRollerUI };
