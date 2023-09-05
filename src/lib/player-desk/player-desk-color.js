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
        variants: [
            "#10de10",
            "#19bd19",
            "#1d991d",
            "#1e781e",
            "#1c571c",
            "#143614",
        ],
    },
    {
        colorName: "red",
        hexColor: "#FF0505", //"#FF2417",
        plasticHexColor: "#ff0909", //"#D00404", //"#CB0000",
        chatHexColor: "#FF2020",
        widgetHexColor: "#FF1010",
        defaultPlayerSlot: 16,
        variants: [
            "#de1010",
            "#bd1919",
            "#991d1d",
            "#781e1e",
            "#571c1c",
            "#361414",
        ],
    },
    {
        colorName: "yellow",
        hexColor: "#FFD900", //"#FFDA00",
        plasticHexColor: "#ffdc13", ////"#FFDA00",
        chatHexColor: "#FFFF00",
        widgetHexColor: "#D7B700",
        defaultPlayerSlot: 9,
        variants: [
            "#dede10",
            "#bdbd19",
            "#99991d",
            "#78781e",
            "#57571c",
            "#363614",
        ],
    },
    {
        colorName: "pink",
        hexColor: "#FF74D6", //"#FF84D6",
        plasticHexColor: "#f68cd7", //"#F46FCD",
        chatHexColor: "#FC46AA",
        widgetHexColor: "#F46FCD",
        defaultPlayerSlot: 5,
        variants: [
            "#de1099",
            "#781757",
            "#991d70",
            "#781e5a",
            "#571c43",
            "#36142a",
        ],
    },
    {
        colorName: "orange",
        hexColor: "#FF8C00", //"#FF932B",
        plasticHexColor: "#ff8d54", //"#FF7603",
        chatHexColor: "#FF8C00",
        widgetHexColor: "#FC6A03",
        defaultPlayerSlot: 6,
        variants: [
            "#ff8000",
            "#de5f10",
            "#bd5719",
            "#994d1d",
            "#78401e",
            "#57321c",
            "#362114",
        ],
    },
    {
        colorName: "purple", // TTS 7400B7
        hexColor: "#B252FF",
        plasticHexColor: "#9d00f8", //"#8000FF", // 7500b7, A300FF, 5E219C
        chatHexColor: "#AF69EF", //"#D7A1F9", //"#BB86FC",
        widgetHexColor: "#572780",
        defaultPlayerSlot: 4,
        variants: [
            "#5410de",
            "#4f19bd",
            "#461d99",
            "#3c1e78",
            "#2f1c57",
            "#1f1436",
        ],
    },
    {
        colorName: "blue", // TTS 07B2FF v
        hexColor: "#00CFFF", //"#07B2FF",
        plasticHexColor: "#39c1ff", //"#07B2FF",
        chatHexColor: "#00CFFF",
        widgetHexColor: "#00CFFF",
        defaultPlayerSlot: 15,
        variants: [
            "#1077de",
            "#196bbd",
            "#1d5b99",
            "#1e4b78",
            "#1c3957",
            "#142536",
        ],
    },
    {
        colorName: "white",
        hexColor: "#F0F0F0", //"#BABABA",
        plasticHexColor: "#e6e6e6", //"#C1C1C1",
        chatHexColor: "#FFFFFF",
        widgetHexColor: "#F0F0F0",
        defaultPlayerSlot: 18,
        variants: [
            "#dedede",
            "#bfbfbf",
            "#9e9e9e",
            "#808080",
            "#5e5e5e",
            "#404040",
        ],
    },
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
}

module.exports = { PlayerDeskColor, PLAYER_DESK_COLORS };
