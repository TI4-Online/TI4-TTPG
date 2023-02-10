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
        plasticHexColor: "#00A300", // 007406 00A306 5AE35A
        chatHexColor: "#00FF00",
        widgetHexColor: "#00FF00",
        defaultPlayerSlot: 1,
    },
    {
        colorName: "red",
        hexColor: "#FF0505", //"#FF2417",
        plasticHexColor: "#CB0000", //"#D00404", //"#CB0000",
        chatHexColor: "#FF2020",
        widgetHexColor: "#FF1010",
        defaultPlayerSlot: 16,
    },
    {
        colorName: "yellow",
        hexColor: "#FFD900", //"#FFDA00",
        plasticHexColor: "#D7B700", ////"#FFDA00",
        chatHexColor: "#FFFF00",
        widgetHexColor: "#D7B700",
        defaultPlayerSlot: 9,
    },
    {
        colorName: "pink",
        hexColor: "#FF74D6", //"#FF84D6",
        plasticHexColor: "#F46FCD", //"#F46FCD",
        chatHexColor: "#FC46AA",
        widgetHexColor: "#F46FCD",
        defaultPlayerSlot: 5,
    },
    {
        colorName: "orange",
        hexColor: "#FF8C00", //"#FF932B",
        plasticHexColor: "#FF8C00", //"#FF7603",
        chatHexColor: "#FF8C00",
        widgetHexColor: "#FC6A03",
        defaultPlayerSlot: 6,
    },
    {
        colorName: "purple", // TTS 7400B7
        hexColor: "#C800FF",
        plasticHexColor: "#8000FF", // 7500b7, A300FF, 5E219C
        chatHexColor: "#AF69EF", //"#D7A1F9", //"#BB86FC",
        widgetHexColor: "#572780",
        defaultPlayerSlot: 4,
    },
    {
        colorName: "blue", // TTS 07B2FF v
        hexColor: "#00CFFF", //"#07B2FF",
        plasticHexColor: "#00CFFF", //"#07B2FF",
        chatHexColor: "#00CFFF",
        widgetHexColor: "#00CFFF",
        defaultPlayerSlot: 15,
    },
    {
        colorName: "white",
        hexColor: "#F0F0F0", //"#BABABA",
        plasticHexColor: "#E0E0E0", //"#C1C1C1",
        chatHexColor: "#FFFFFF",
        widgetHexColor: "#F0F0F0",
        defaultPlayerSlot: 18,
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

    static change(playerDesk, newColorName) {
        assert(playerDesk);
        assert(typeof newColorName === "string");

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

        // Apply to the player slot too.
        world.setSlotColor(playerDesk.playerSlot, playerDesk._color);
    }
}

module.exports = { PlayerDeskColor, PLAYER_DESK_COLORS };
