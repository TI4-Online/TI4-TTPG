const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { world } = require("../../wrapper/api");

const PLAYER_DESK_COLORS = [
    {
        colorName: "green",
        hexColor: "#5AE35A",
        plasticHexColor: "#00A306",
        defaultPlayerSlot: 1,
    },
    {
        colorName: "red",
        hexColor: "#FF2417",
        plasticHexColor: "#CB0000",
        defaultPlayerSlot: 16,
    },
    {
        colorName: "yellow",
        hexColor: "#FFDA00",
        plasticHexColor: "#FFDA00",
        defaultPlayerSlot: 9,
    },
    {
        colorName: "pink",
        hexColor: "#FF84D6",
        plasticHexColor: "#F46FCD",
        defaultPlayerSlot: 5,
    },
    {
        colorName: "orange",
        hexColor: "#FF932B",
        plasticHexColor: "#FF7603",
        defaultPlayerSlot: 6,
    },
    {
        colorName: "purple",
        hexColor: "#C800FF",
        plasticHexColor: "#5E219C",
        defaultPlayerSlot: 4,
    },
    {
        colorName: "blue",
        hexColor: "#07B2FF",
        plasticHexColor: "#07B2FF",
        defaultPlayerSlot: 15,
    },
    {
        colorName: "white",
        hexColor: "#BABABA",
        plasticHexColor: "#C1C1C1",
        defaultPlayerSlot: 18,
    },
];

class PlayerDeskColor {
    static change(playerDesk, newColorName) {
        assert(playerDesk);
        assert(typeof newColorName === "string");

        console.log(
            `PlayerDeskColor.change: index=${playerDesk.index} from=${playerDesk.colorName} to=${newColorName}`
        );

        let colorAttrs = undefined;
        for (const candidate of PLAYER_DESK_COLORS) {
            if (candidate.colorName === newColorName) {
                colorAttrs = candidate;
                break;
            }
        }
        assert(colorAttrs);

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
