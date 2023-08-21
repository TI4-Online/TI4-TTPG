const { TabDisplayUI } = require("./tab-display-ui");
const { world } = require("../../wrapper/api");
const locale = require("../../lib/locale");
const {
    SystemTileBrightness,
} = require("../../lib/display/system-tile-brightness");

class TabDisplay {
    constructor() {}

    getWidget() {
        const sections = [
            this._sectionFactionBorders(),
            this._sectionTileBrightness(),
        ];
        return new TabDisplayUI().createWidget(sections);
    }

    _sectionFactionBorders() {
        return {
            label: locale("display.faction_borders.label"),
            description: locale("display.faction_borders.description"),
            entries: [
                {
                    label: locale("display.faction_borders.enable_borders"),
                    default: world.TI4.borders.getEnabled(),
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        console.log(
                            `TabDisplay toggle borders (global) ${isChecked}`
                        );
                        world.TI4.borders.setEnabled(isChecked);
                    },
                },
                {
                    label: locale("display.faction_borders.team_borders"),
                    default: world.TI4.borders.getTeams(),
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        console.log(`TabDisplay team borders ${isChecked}`);
                        world.TI4.borders.setTeams(isChecked);
                    },
                },
                {
                    label: locale("display.faction_borders.per_player"),
                    onClicked: (button, player) => {
                        const playerSlot = player.getSlot();
                        const oldValue =
                            world.TI4.borders.getVisible(playerSlot);
                        const newValue = !oldValue;
                        console.log(
                            `TabDisplay toggle borders playerSlot "${playerSlot}" (${oldValue} -> ${newValue})`
                        );
                        world.TI4.borders.setVisible(playerSlot, newValue);
                    },
                },
            ],
        };
    }

    _sectionTileBrightness() {
        return {
            label: locale("display.tile_brighness.label"),
            description: locale("display.tile_brighness.description"),
            entries: [
                {
                    label: locale("display.tile_brighness.brightness"),
                    default: Math.round(SystemTileBrightness.get() * 100),
                    min: 50,
                    max: 100,
                    onValueChanged: (slider, player, value) => {
                        SystemTileBrightness.set(value / 100);
                    },
                },
            ],
        };
    }

    /*

    updateBrightness(value) {
        console.log(`TabDisplay.updateBrightness ${value}`);
        SystemTileBrightness.set(value);
    }

    
    */
}

module.exports = { TabDisplay };
