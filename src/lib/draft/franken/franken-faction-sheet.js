const assert = require("../../../wrapper/assert-wrapper");
const {
    LayoutBox,
    RichText,
    Text,
    UIElement,
    UIZoomVisibility,
    Vector,
    VerticalBox,
    refObject,
    refPackageId,
} = require("../../../wrapper/api");
const { FACTION_ABILITIES } = require("./franken.data");
const { _abilityNameToNsidName } = require("./franken-create-sources");
const locale = require("../../locale");
const { Technology } = require("../../technology/technology");
const { PlayerDeskColor } = require("../../player-desk/player-desk-color");

const UI_SCALE = 8;

class FrankenFactionSheet {
    constructor(obj) {
        console.log(`FrankenFactionSheet.new ${obj.getId()}`);

        this._obj = obj;
        this._uiZ = this._obj.getExtent().z + 0.1;

        this._name = this._addName();
        this._abilitiesPanel = this._addAbilitiesPanel();
        this._addAbility(); // demo
        this._addAbility();
        this._commodities = this._addCommodities();
        this._startingPanel = this._addStartingPanel();
        this._addStartingTech();
        this._addStartingUnits();

        this._obj.__frankenFactionSheet = this;

        const json = obj.getSavedData();
        if (json && json.length > 0) {
            const factionAttrs = JSON.parse(json);
            this._applyFactionAttrs(factionAttrs);
        }
    }

    setFactionAttrs(factionAttrs) {
        const json = JSON.stringify(factionAttrs);
        if (json.length > 1023) {
            console.log(
                "FrankenFactionSheet._save: data exceeds maximum size, skipping!"
            );
            return;
        }
        this._obj.setSavedData(json);
        this._applyFactionAttrs(factionAttrs);
    }

    _applyFactionAttrs(factionAttrs) {
        const abilityToEntry = {};
        for (const entry of FACTION_ABILITIES) {
            const nsidName = _abilityNameToNsidName(entry.name);
            abilityToEntry[nsidName] = entry;
        }

        const name = locale(
            `faction.full.${factionAttrs.faction}`
        ).toUpperCase();
        this._name.setText(name);

        const abilities = [];
        for (const nsidName of factionAttrs.abilities) {
            const ability = abilityToEntry[nsidName];
            assert(nsidName);
            abilities.push(ability);
        }
        this._abilitiesPanel.removeAllChildren();
        abilities.forEach((ability) => {
            const { nameText, descText } = this._addAbility();
            nameText.setText(ability.name);
            descText.setText(ability.description);
        });

        const commodities = factionAttrs.commodities;
        this._commodities.setText(`${commodities}`);

        this._startingPanel.removeAllChildren();
        const startingTechText = this._addStartingTech();
        const startingTechValue = factionAttrs.startingTech
            .map((tech) => {
                const techData = Technology.getByNsidName(tech);
                if (!techData) {
                    console.log(
                        `Franken.createStartingTech: unknown tech "${tech}"`
                    );
                    return tech;
                }

                let color = "#ffffff";
                const type = techData.type.toLowerCase();
                if (
                    type === "blue" ||
                    type === "green" ||
                    type === "yellow" ||
                    type === "red"
                ) {
                    const attrs = PlayerDeskColor.getColorAttrs(type);
                    color = attrs.widgetHexColor;
                }
                return `[color=${color}]${techData.name}[/color]`;
            })
            .join("\n");
        startingTechText.setText(startingTechValue);

        const startingUnitsText = this._addStartingUnits();
        const startingUnitsValue = Object.entries(factionAttrs.startingUnits)
            .map(([unit, count]) => {
                unit = locale(`unit.${unit}`);
                return `${count} ${unit}`;
            })
            .join("\n");
        startingUnitsText.setText(startingUnitsValue);
    }

    _addName() {
        const nameText = new Text()
            .setFontSize(7 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("FACTION NAME");

        const ui = new UIElement();
        ui.position = new Vector(8.7, 2.1, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = nameText;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return nameText;
    }

    _addAbilitiesPanel() {
        const panel = new VerticalBox().setChildDistance(2 * UI_SCALE);

        const ui = new UIElement();
        ui.anchorX = 0;
        ui.anchorY = 0;
        ui.position = new Vector(4.68, 7.69, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = panel;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return panel;
    }

    _addAbility() {
        const nameText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("ABILITY NAME");

        const descText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("myriad-pro-semibold.ttf", refPackageId)
            .setText(
                "Ability description test long text wraps correctly in box."
            )
            .setAutoWrap(true);

        const descIndent = new LayoutBox()
            .setPadding(1.7 * UI_SCALE, 0, 0, 0)
            .setOverrideWidth(57 * UI_SCALE)
            .setChild(descText);

        const panel = new VerticalBox().addChild(nameText).addChild(descIndent);

        this._abilitiesPanel.addChild(panel);
        return { nameText, descText };
    }

    _addCommodities() {
        const commoditiesText = new Text()
            .setFontSize(13 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("0");

        const ui = new UIElement();
        ui.anchorX = 1;
        ui.position = new Vector(-3.9, 12.7, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = commoditiesText;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return commoditiesText;
    }

    _addStartingPanel() {
        const panel = new VerticalBox().setChildDistance(2 * UI_SCALE);

        const ui = new UIElement();
        ui.anchorX = 0;
        ui.anchorY = 1;
        ui.position = new Vector(0.3, 0.5, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = panel;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return panel;
    }

    _addStartingTech() {
        const nameText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("STARTING TECHNOLOGY");

        const descText = new RichText()
            .setFontSize(2 * UI_SCALE)
            .setFont("myriad-pro-semibold.ttf", refPackageId)
            .setText("?")
            .setAutoWrap(true);

        const descIndent = new LayoutBox()
            .setPadding(1.7 * UI_SCALE, 0, 0, 0)
            .setOverrideWidth(59 * UI_SCALE)
            .setChild(descText);

        const panel = new VerticalBox().addChild(nameText).addChild(descIndent);

        this._startingPanel.addChild(panel);
        return descText;
    }

    _addStartingUnits() {
        const nameText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("STARTING UNITS");

        const descText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("myriad-pro-semibold.ttf", refPackageId)
            .setText("?")
            .setAutoWrap(true);

        const descIndent = new LayoutBox()
            .setPadding(1.7 * UI_SCALE, 0, 0, 0)
            .setOverrideWidth(57 * UI_SCALE)
            .setChild(descText);

        const panel = new VerticalBox().addChild(nameText).addChild(descIndent);

        this._startingPanel.addChild(panel);
        return descText;
    }
}

const _doNotGC = new FrankenFactionSheet(refObject);
assert(_doNotGC);
