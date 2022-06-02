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
        for (const slice of customConfig.slices) {
            const error = MiltyUtil.getSliceError(slice);
            if (error) {
                return error;
            }
        }
        return false;
    }

    static parseSliceString(sliceStr) {
        assert(typeof sliceStr === "string");
        return Array.from(sliceStr.matchAll(/\d+/g)).map((str) =>
            Number.parseInt(str)
        );
    }

    static parseCustomConfig(customStr) {
        assert(typeof customStr === "string");

        customStr = customStr.trim();

        const removePrefix = "slices=";
        if (customStr.startsWith(removePrefix)) {
            customStr = customStr.substr(removePrefix.length);
        }

        if (customStr.length === 0) {
            return;
        }

        const result = {};
        const parts = customStr.split("&");

        // First part is always slices, no arg.
        const sliceStrs = parts.shift().split("|");
        result.slices = sliceStrs
            .map((sliceStr) => {
                return MiltyUtil.parseSliceString(sliceStr);
            })
            .filter((slice) => {
                return slice && slice.length === 5;
            });

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
            }
            if (part.startsWith("factions=")) {
                const partParts = part.split("=");
                if (partParts.length > 1) {
                    result.factions = partParts[1].split("|").map((x) => {
                        return x.trim();
                    });

                    // Update for aliases (used by miltydraft.com).
                    // Strip out any unrecognized strings.
                    result.factions = result.factions
                        .map((name) => {
                            const nsidName = FactionAliases.getNsid(name);
                            if (!nsidName && !world.__isMock) {
                                console.log(
                                    `MiltyUtil.parseCustomConfig: unknown faction "${name}"`
                                );
                            }
                            return nsidName;
                        })
                        .filter((nsidName) => {
                            return nsidName;
                        });
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
