const assert = require("../../../wrapper/assert-wrapper");

const DEFAULT_WRAP_AT = 20;

class MiltyUtil {
    static validateSliceOrThrow(miltySlice) {
        assert(Array.isArray(miltySlice));
        if (miltySlice.length !== 5) {
            throw new Error(`MiltyUtil.validate: slice does not have 5 tiles`);
        }
        for (const tile of miltySlice) {
            if (typeof tile !== "number") {
                throw new Error("MiltyUtil.validate: tile is not a number");
            }
        }
        return true;
    }

    static parseSliceString(miltySliceStr) {
        assert(typeof miltySliceStr === "string");
        return Array.from(miltySliceStr.matchAll(/\d+/g)).map((str) =>
            Number.parseInt(str)
        );
    }

    static parseCustomConfig(customStr) {
        assert(typeof customStr === "string");

        customStr = customStr.trim();
        if (customStr.length === 0) {
            return;
        }

        const result = {};
        const parts = customStr.split("&");

        // First part is always slices, no arg.
        const sliceStrs = parts.shift().split("|");
        result.slices = sliceStrs.map((sliceStr) => {
            return MiltyUtil.parseSliceString(sliceStr);
        });

        // More parts?
        while (parts.length > 0) {
            const part = parts.shift();
            if (part.startsWith("labels=")) {
                const partParts = part.split("=");
                assert(partParts.length === 2);
                result.labels = partParts[1].split("|");
            } else {
                throw new Error(`unknown part ${part}`);
            }
        }
        return result;
    }

    static wrapSliceLabel(label, wrapAt) {
        assert(typeof label === "string");
        assert(typeof wrapAt === "number");

        // Adding to a string creates a different object.  Instead push
        // to a per-line token list.
        let currentLine = [];
        let currentLineLen = 0;

        const result = [currentLine];

        const tokens = label.split(" ");
        for (const token of tokens) {
            let delimLen = currentLineLen > 0 ? 1 : 0;
            const tokenLen = token.length;
            if (currentLineLen + delimLen + tokenLen > wrapAt) {
                currentLine = [];
                currentLineLen = 0;
                delimLen = 0;
                result.push(currentLine);
            }
            currentLine.push(token);
            currentLineLen += delimLen + tokenLen;
        }
        return result.map((line) => line.join(" ")).join("\n");
    }
}

module.exports = { MiltyUtil, DEFAULT_WRAP_AT };
