const locale = require("../../lib/locale");
const { MapRingLines } = require("../../lib/display/map-ring-lines");
const { PlayerDeskLines } = require("../../lib/display/player-desk-lines");
const {
    SystemTileBrightness,
} = require("../../lib/display/system-tile-brightness");
const { TabDisplayUI } = require("./tab-display-ui");
const { TableColor } = require("../../lib/display/table-color");
const { Color, refPackageId, world } = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");

class TabDisplay {
    constructor() {}

    getWidget() {
        const sections = [
            this._sectionBackground(),
            this._sectionFactionBorders(),
            this._sectionTileBrightness(),
            this._sectionDeskBorders(),
            this._sectionMapRings(),
            this._sectionTableColor(),
            this._sectionTurnTimer(),
        ];
        return new TabDisplayUI().createWidget(sections);
    }

    _sectionBackground() {
        const bgFile = "global/background/nebula.jpg";
        const getBlimp = () => {
            for (const obj of world.getAllObjects(true)) {
                if (ObjectNamespace.getNsid(obj) === "trh:props/blimp") {
                    return obj;
                }
            }
        };
        return {
            label: "Background",
            description: "SCPT nebula background & blimp",
            entries: [
                {
                    label: "background",
                    getDefault: () => {
                        return world.getBackgroundFilename() === bgFile;
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        console.log(`TabDisplay toggle nebula ${isChecked}`);
                        if (isChecked) {
                            world.setBackground(bgFile, refPackageId);
                        } else {
                            world.setBackground("", "");
                        }
                    },
                },
                {
                    label: "blimp",
                    getDefault: () => {
                        return getBlimp() ? true : false;
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        console.log(`TabDisplay toggle blimp ${isChecked}`);
                        if (isChecked) {
                            const blimp = world.createObjectFromTemplate(
                                "554A154B47C9D0D19AAFA194C27D91D2",
                                [0, 0, 0]
                            );
                            blimp.setTags(["DELETED_ITEMS_IGNORE"]);
                        } else {
                            const obj = getBlimp();
                            if (obj) {
                                obj.destroy();
                            }
                        }
                    },
                },
            ],
        };
    }

    _sectionFactionBorders() {
        return {
            label: locale("display.faction_borders.label"),
            description: locale("display.faction_borders.description"),
            entries: [
                {
                    label: locale("display.faction_borders.enable_borders"),
                    getDefault: () => {
                        return world.TI4.borders.getEnabled();
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        console.log(
                            `TabDisplay toggle borders (global) ${isChecked}`
                        );
                        world.TI4.borders.setEnabled(isChecked);
                    },
                },
                {
                    label: locale("display.faction_borders.team_borders"),
                    getDefault: () => {
                        return world.TI4.borders.getTeams();
                    },
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
                    getDefault: () => {
                        return Math.round(SystemTileBrightness.get() * 100);
                    },
                    min: 50,
                    max: 100,
                    onValueChanged: (slider, player, value) => {
                        SystemTileBrightness.set(value / 100);
                    },
                },
                {
                    label: locale("display.reset_to_defaults"),
                    onClicked: (button, player) => {
                        SystemTileBrightness.resetToDefaults();
                    },
                    reset: true,
                },
            ],
        };
    }

    _sectionDeskBorders() {
        return {
            label: locale("display.desk_borders.label"),
            description: locale("display.desk_borders.description"),
            entries: [
                {
                    label: locale("display.desk_borders.enable_borders"),
                    getDefault: () => {
                        return PlayerDeskLines.isEnabled();
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        if (isChecked) {
                            PlayerDeskLines.addAllPlayerDeskLines();
                        } else {
                            PlayerDeskLines.clearAllPlayerDeskLines();
                        }
                    },
                },
            ],
        };
    }

    _sectionMapRings() {
        return {
            label: locale("display.map_rings.label"),
            description: locale("display.map_rings.description"),
            entries: [
                {
                    label: locale("display.map_rings.enable_rings"),
                    getDefault: () => {
                        return MapRingLines.isEnabled();
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        if (isChecked) {
                            MapRingLines.addMapRingLines();
                        } else {
                            MapRingLines.clearMapRingLines();
                        }
                    },
                },
            ],
        };
    }

    _sectionTableColor() {
        return {
            label: locale("display.table_color.label"),
            description: locale("display.table_color.description"),
            entries: [
                {
                    label: locale("display.table_color.table"),
                    getDefault: () => {
                        const primary = TableColor.getPrimary();
                        return Math.round(primary.r * 100);
                    },
                    min: 0,
                    max: 50,
                    onValueChanged: (slider, player, value) => {
                        value = value / 100;
                        TableColor.setPrimary(
                            new Color(value, value, value, 1)
                        );
                    },
                },
                {
                    label: locale("display.table_color.desks"),
                    getDefault: () => {
                        const secondary = TableColor.getSecondary();
                        return Math.round(secondary.r * 100);
                    },
                    min: 0,
                    max: 50,
                    onValueChanged: (slider, player, value) => {
                        value = value / 100;
                        TableColor.setSecondary(
                            new Color(value, value, value, 1)
                        );
                    },
                },
                {
                    label: locale("ui.setup.dark_table"),
                    onClicked: (button, player) => {
                        TableColor.resetToDark();
                    },
                    reset: true,
                },
                {
                    label: locale("display.reset_to_defaults"),
                    onClicked: (button, player) => {
                        TableColor.resetToDefaults();
                    },
                    reset: true,
                },
            ],
        };
    }

    _sectionTurnTimer() {
        let isEnabled = world.TI4.config.timer >= 0;
        let isCountdown = world.TI4.config.timer > 0;
        let timeLimitValue = Math.max(world.TI4.config.timer, 0);

        console.log(JSON.stringify({ isEnabled, isCountdown, timeLimitValue }));

        const updateTimerConfig = () => {
            let value = -1;
            if (isEnabled) {
                if (isCountdown) {
                    value = timeLimitValue;
                } else {
                    value = 0; // count up
                }
            }
            console.log(`TabDisplay update timer ${value}`);
            world.TI4.config.setTimer(value);
        };

        return {
            label: locale("display.turn_timer.label"),
            description: locale("display.turn_timer.description"),
            entries: [
                {
                    label: locale("display.turn_timer.enable_timer"),
                    getDefault: () => {
                        return world.TI4.config.timer >= 0;
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        isEnabled = isChecked;
                        updateTimerConfig();
                    },
                },
                {
                    label: locale("display.turn_timer.countdown"),
                    getDefault: () => {
                        return world.TI4.config.timer > 0;
                    },
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        isCountdown = isChecked;
                        updateTimerConfig();
                    },
                },
                {
                    label: locale("display.turn_timer.time_limit"),
                    getDefault: () => {
                        return Math.max(world.TI4.config.timer, 0) / 60;
                    },
                    min: 0,
                    max: 10,
                    stepSize: 0.5,
                    onValueChanged: (slider, player, value) => {
                        timeLimitValue = Math.round(value * 60);
                        updateTimerConfig();
                    },
                },
            ],
        };
    }
}

module.exports = { TabDisplay };
