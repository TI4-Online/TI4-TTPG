const assert = require("../../../wrapper/assert-wrapper");
const { FactionAliases } = require("../../faction/faction-aliases");
const { world } = require("../../../wrapper/api");

const DEFAULT_WRAP_AT = 20;

class MiltyUtil {
    static getSliceError(miltySlice) {
        assert(Array.isArray(miltySlice));
        if (miltySlice.length !== 5) {
            return `slice does not have 5 tiles`;
        }
        for (const tile of miltySlice) {
            if (typeof tile !== "number") {
                return `tile "${tile}" is not a number`;
            }
        }
        return false;
    }

    static getCustomConfigError(customConfig) {
        if (customConfig.slices) {
            for (const slice of customConfig.slices) {
                const error = MiltyUtil.getSliceError(slice);
                if (error) {
                    return error;
                }
            }
        }
        if (customConfig.factions) {
            for (const factionNsidName of customConfig.factions) {
                if (!world.TI4.getFactionByNsidName(factionNsidName)) {
                    return `unknown faction "${factionNsidName}"`;
                }
            }
        }
        return false;
    }

    static parseSliceString(sliceStr) {
        assert(typeof sliceStr === "string");
        const tiles = Array.from(sliceStr.matchAll(/\d+/g)).map((str) =>
            Number.parseInt(str)
        );
        if (tiles.length !== 5) {
            return false;
        }
        return tiles;
    }

    static parseSliceSetString(sliceSetStr) {
        assert(typeof sliceSetStr === "string");
        return sliceSetStr
            .split("|")
            .map((sliceStr) => {
                return MiltyUtil.parseSliceString(sliceStr);
            })
            .filter((slice) => {
                return slice; // parseSliceString can fail on bad input
            });
    }

    static parseCustomConfig(customStr) {
        assert(typeof customStr === "string");

        customStr = customStr.trim();
        if (customStr.length === 0) {
            return;
        }

        const result = {};
        const parts = customStr.split("&").map((part) => {
            return part.trim();
        });
        if (parts.length === 0) {
            return;
        }

        // Format allows first entry to be raw slice set without any key.
        if (Number.parseInt(parts[0])) {
            const sliceSetStr = parts.shift();
            result.slices = MiltyUtil.parseSliceSetString(sliceSetStr);
        }

        // More parts?
        while (parts.length > 0) {
            const part = parts.shift();
            if (part.startsWith("labels=")) {
                const partParts = part.split("=");
                if (partParts.length > 1) {
                    result.labels = partParts[1].split("|").map((x) => {
                        return x.trim();
                    });
                }
            } else if (part.startsWith("factions=")) {
                const partParts = part.split("=");
                if (partParts.length > 1) {
                    result.factions = partParts[1].split("|").map((x) => {
                        return x.trim();
                    });

                    // Update for aliases (used by miltydraft.com).
                    // Pass along any unrecognized strings.
                    result.factions = result.factions.map((name) => {
                        const nsidName = FactionAliases.getNsid(name);
                        return nsidName || name;
                    });
                }
            } else if (part.startsWith("slices=")) {
                // In addition to "first item" presence, slice set can be given with an argument.
                const partParts = part.split("=");
                if (partParts.length > 1) {
                    result.slices = MiltyUtil.parseSliceSetString(partParts[1]);
                }
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
