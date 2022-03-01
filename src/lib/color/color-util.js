const assert = require("../../wrapper/assert-wrapper");
const { Color } = require("../../wrapper/api");

class ColorUtil {
    static isColor(color) {
        return typeof color.r === "number";
    }

    static colorFromHex(hexColor) {
        assert(typeof hexColor === "string");
        assert(hexColor.startsWith("#"));
        assert(hexColor.length === 7);

        const m = hexColor.match(/^#([0-9a-f]{6})$/i)[1];
        const r = parseInt(m.substr(0, 2), 16);
        const g = parseInt(m.substr(2, 2), 16);
        const b = parseInt(m.substr(4, 2), 16);
        return new Color(r / 255, g / 255, b / 255, 1);
    }

    static colorToHex(color) {
        assert(ColorUtil.isColor(color));

        const f2h = (f) => {
            return Math.round(f * 255)
                .toString(16)
                .padStart(2, "0");
        };
        const r = f2h(color.r);
        const g = f2h(color.g);
        const b = f2h(color.b);
        return `#${r}${g}${b}`;
    }
}

module.exports = { ColorUtil };
