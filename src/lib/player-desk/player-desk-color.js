const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { world } = require("../../wrapper/api");

/**
 * Supply colors for different contexts:
 * - hexColor: deprecated, should always use a specialized color!
 * - plasticHexColor: plastic units
 * - chatHexColor: chat window text, defaults to plastic color
 * - widgetHexColor: ui text widget & background color, defaults to plastic color
 */
const PLAYER_DESK_COLORS = [
    {
        colorName: "green", // TTS 007306
        hexColor: "#00C60A",
        plasticHexColor: "#00c20a", // 007306 00A306 5AE35A
        chatHexColor: "#00FF00",
        widgetHexColor: "#00FF00",
        defaultPlayerSlot: 1,
        variants: ["#5dc262", "#0c9113", "#82eb09", "#09eb67"],
    },
    {
        colorName: "red",
        hexColor: "#FF0505", //"#FF2417",
        plasticHexColor: "#ff0909", //"#D00404", //"#CB0000",
        chatHexColor: "#FF2020",
        widgetHexColor: "#FF1010",
        defaultPlayerSlot: 16,
        variants: ["#ad5e5e", "#c02516", "#cf213e", "#ff6969"],
    },
    {
        colorName: "yellow",
        hexColor: "#FFD900", //"#FFDA00",
        plasticHexColor: "#ffdc13", ////"#FFDA00",
        chatHexColor: "#FFFF00",
        widgetHexColor: "#D7B700",
        defaultPlayerSlot: 9,
        variants: ["#fce979", "#a69317", "#d6bd4b", "#f6ff00"],
    },
    {
        colorName: "pink",
        hexColor: "#FF74D6", //"#FF84D6",
        plasticHexColor: "#f68cd7", //"#F46FCD",
        chatHexColor: "#FC46AA",
        widgetHexColor: "#F46FCD",
        defaultPlayerSlot: 5,
        variants: ["#edadd9", "#c21f90", "#bd2db0", "#de64b1"],
    },
    {
        colorName: "orange",
        hexColor: "#FF8C00", //"#FF932B",
        plasticHexColor: "#ff8d54", //"#FF7603",
        chatHexColor: "#FF8C00",
        widgetHexColor: "#FC6A03",
        defaultPlayerSlot: 6,
        variants: ["#e09f5c", "#854300", "#ff6200", "#ffa600"],
    },
    {
        colorName: "purple", // TTS 7400B7
        hexColor: "#B252FF",
        plasticHexColor: "#9d00f8", //"#8000FF", // 7500b7, A300FF, 5E219C
        chatHexColor: "#AF69EF", //"#D7A1F9", //"#BB86FC",
        widgetHexColor: "#572780",
        defaultPlayerSlot: 4,
        variants: ["#af76cf", "#681d91", "#945ced", "#a600ff"],
    },
    {
        colorName: "blue", // TTS 07B2FF v
        hexColor: "#00CFFF", //"#07B2FF",
        plasticHexColor: "#39c1ff", //"#07B2FF",
        chatHexColor: "#00CFFF",
        widgetHexColor: "#00CFFF",
        defaultPlayerSlot: 15,
        variants: ["#6fd9f2", "#0e96b5", "#00ffea", "#0091ff"],
    },
    {
        colorName: "white",
        hexColor: "#F0F0F0", //"#BABABA",
        plasticHexColor: "#e6e6e6", //"#C1C1C1",
        chatHexColor: "#FFFFFF",
        widgetHexColor: "#F0F0F0",
        defaultPlayerSlot: 18,
        variants: ["#969696", "#4a4a4a", "#2c2c2e", "#2e2626"],
    },
];

const RAINBOW = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "white",
];

class PlayerDeskColor {
    static getColorAttrs(colorName) {
        assert(typeof colorName === "string");
        for (const candidate of PLAYER_DESK_COLORS) {
            if (candidate.colorName === colorName) {
                return candidate;
            }
        }
        throw new Error(
            `PlayerDeskColor.getColorAttrs: unknown colorName "${colorName}"`
        );
    }

    static reset(playerDesk) {
        PlayerDeskColor.change(playerDesk, playerDesk._colorName);
    }

    static change(playerDesk, newColorName, overridePlasticColorHex) {
        assert(playerDesk);
        assert(typeof newColorName === "string");
        assert(
            !overridePlasticColorHex ||
                typeof overridePlasticColorHex === "string"
        );

        // if (!world.__isMock) {
        //     console.log(
        //         `PlayerDeskColor.change: index=${playerDesk.index} from=${playerDesk.colorName} to=${newColorName}`
        //     );
        // }

        const colorAttrs = PlayerDeskColor.getColorAttrs(newColorName);

        // Rewrite desk fields.
        playerDesk._colorName = colorAttrs.colorName;
        playerDesk._color = ColorUtil.colorFromHex(colorAttrs.hexColor);
        playerDesk._plasticColor = ColorUtil.colorFromHex(
            colorAttrs.plasticHexColor
        );
        playerDesk._chatColor = ColorUtil.colorFromHex(
            colorAttrs.chatHexColor
                ? colorAttrs.chatHexColor
                : colorAttrs.plasticHexColor
        );
        playerDesk._widgetColor = ColorUtil.colorFromHex(
            colorAttrs.widgetHexColor
                ? colorAttrs.widgetHexColor
                : colorAttrs.plasticHexColor
        );

        playerDesk._overridePlasticColorHex = overridePlasticColorHex;
        playerDesk._overridePlasticColor = overridePlasticColorHex
            ? ColorUtil.colorFromHex(overridePlasticColorHex)
            : undefined;

        // Apply to the player slot too.
        world.setSlotColor(playerDesk.playerSlot, playerDesk._color);
    }

    static createRainbow() {
        RAINBOW.forEach((colorName, colIdx) => {
            const attrs = PlayerDeskColor.getColorAttrs(colorName);
            const values = [attrs.plasticHexColor, ...attrs.variants];
            values.forEach((colorHex, rowIdx) => {
                console.log(`${colorName} [${colIdx},${rowIdx}]: ${colorHex}`);
                const color = ColorUtil.colorFromHex(colorHex);
                const cube = "83FDE12C4E6D912B16B85E9A00422F43";
                const z = world.getTableHeight() + 5;
                const obj = world.createObjectFromTemplate(cube, [
                    (rowIdx + 5) * -5.7,
                    (colIdx - 3.5) * 5.7,
                    z,
                ]);

                obj.setPrimaryColor(color);
                obj.setName(`${colorName}\n${colorHex}`);
            });
        });
    }
}

module.exports = { PlayerDeskColor, PLAYER_DESK_COLORS, RAINBOW };
