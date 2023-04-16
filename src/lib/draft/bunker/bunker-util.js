const assert = require("../../../wrapper/assert-wrapper");
const { FactionAliases } = require("../../faction/faction-aliases");
const { world } = require("../../../wrapper/api");
const { Broadcast } = require("../../broadcast");

class BunkerUtil {
    static getSliceError(bunkerSlice) {
        assert(Array.isArray(bunkerSlice));
        if (bunkerSlice.length !== 4) {
            return `slice does not have 4 tiles`;
        }
        for (const tile of bunkerSlice) {
            if (typeof tile !== "number") {
                return `tile "${tile}" is not a number`;
            }
        }
        return false;
    }

    static getCustomConfigError(customConfig) {
        if (customConfig.slices) {
            for (const slice of customConfig.slices) {
                const error = BunkerUtil.getSliceError(slice);
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
        if (tiles.length !== 4) {
            return false;
        }
        return tiles;
    }

    static parseSliceSetString(sliceSetStr) {
        assert(typeof sliceSetStr === "string");
        return sliceSetStr
            .split("|")
            .map((sliceStr) => {
                return BunkerUtil.parseSliceString(sliceStr);
            })
            .filter((slice) => {
                return slice; // parseSliceString can fail on bad input
            });
    }

    static parseInnerString(innerStr) {
        assert(typeof innerStr === "string");
        const tiles = Array.from(innerStr.matchAll(/\d+/g)).map((str) =>
            Number.parseInt(str)
        );
        if (tiles.length !== world.TI4.config.playerCount) {
            Broadcast.chatAll(
                "wrong number of fixed tiles (must match player count",
                Broadcast.ERROR
            );
            return false;
        }
        return tiles;
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
            result.slices = BunkerUtil.parseSliceSetString(sliceSetStr);
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
                    result.slices = BunkerUtil.parseSliceSetString(
                        partParts[1]
                    );
                }
            } else if (part.startsWith("inner=") || part.startsWith("eqs=")) {
                const partParts = part.split("=");
                if (partParts.length > 1) {
                    result.inner = BunkerUtil.parseInnerString(partParts[1]);
                }
            }
        }
        return result;
    }
}

module.exports = { BunkerUtil };
