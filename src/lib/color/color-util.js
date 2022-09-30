const assert = require("../../wrapper/assert-wrapper");
const { Color } = require("../../wrapper/api");

class ColorUtil {
    static isColor(color) {
        return typeof color.r === "number";
    }

    static validate(colorOrArray) {
        if (colorOrArray instanceof Color) {
            return true;
        } else if (Array.isArray(colorOrArray)) {
            if (colorOrArray.length < 3 || colorOrArray.length > 4) {
                throw new Error(`bad size (${colorOrArray.length})`);
            }
            for (const value of colorOrArray) {
                if (typeof value !== "number") {
                    throw new Error(`bad type (${typeof value})`);
                }
                if (value < 0 || value > 1) {
                    throw new Error(`bad value (${value})`);
                }
            }
        } else {
            throw new Error("bad arg");
        }
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
