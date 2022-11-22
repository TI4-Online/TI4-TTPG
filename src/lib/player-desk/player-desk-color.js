const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { world } = require("../../wrapper/api");

const PLAYER_DESK_COLORS = [
    {
        colorName: "green",
        hexColor: "#00C60A", //"#5AE35A",
        plasticHexColor: "#007406", //"#00A306",
        defaultPlayerSlot: 1,
    },
    {
        colorName: "red",
        hexColor: "#FF0505", //"#FF2417",
        plasticHexColor: "#CB0000", //"#D00404", //"#CB0000",
        defaultPlayerSlot: 16,
    },
    {
        colorName: "yellow",
        hexColor: "#FFD900", //"#FFDA00",
        plasticHexColor: "#D7B700", ////"#FFDA00",
        defaultPlayerSlot: 9,
    },
    {
        colorName: "pink",
        hexColor: "#FF74D6", //"#FF84D6",
        plasticHexColor: "#F46FCD", //"#F46FCD",
        defaultPlayerSlot: 5,
    },
    {
        colorName: "orange",
        hexColor: "#FF8C00", //"#FF932B",
        plasticHexColor: "#FF8C00", //"#FF7603",
        defaultPlayerSlot: 6,
    },
    {
        colorName: "purple",
        hexColor: "#C800FF",
        plasticHexColor: "#7500b7", // "#A300FF" "#5E219C",
        defaultPlayerSlot: 4,
    },
    {
        colorName: "blue",
        hexColor: "#07B2FF", //"#07B2FF",
        plasticHexColor: "#07B2FF", //"#07B2FF",
        defaultPlayerSlot: 15,
    },
    {
        colorName: "white",
        hexColor: "#F0F0F0", //"#BABABA",
        plasticHexColor: "#E0E0E0", //"#C1C1C1",
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

        // Apply to the player slot too.
        world.setSlotColor(playerDesk.playerSlot, playerDesk._color);
    }
}

module.exports = { PlayerDeskColor, PLAYER_DESK_COLORS };
