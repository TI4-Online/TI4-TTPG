const { world } = require("../../../wrapper/api");
const { Hex } = require("../../hex");

class AbstractUtil {
    static assertIsDeskIndex(deskIndex, returnWarningInsteadOfThrow = false) {
        if (typeof deskIndex !== "number") {
            const err = `deskIndex "${deskIndex}" must be a number`;
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
        if (deskIndex < 0 || deskIndex >= world.TI4.config.playerCount) {
            const err = `deskIndex "${deskIndex}" out of range`;
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
    }

    static assertIsFaction(
        factionNsidName,
        returnWarningInsteadOfThrow = false
    ) {
        if (!world.TI4.getFactionByNsidName(factionNsidName)) {
            const err = `unknown faction "${factionNsidName}"`;
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
    }

    static assertIsHex(hex, returnWarningInsteadOfThrow = false) {
        if (!Hex._hexFromString(hex)) {
            const err = `invalid hex "${hex}"`;
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
    }

    static assertIsShape(shape, returnWarningInsteadOfThrow = false) {
        if (!Array.isArray(shape)) {
            const err = "Shape must be an array";
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
        for (const hex of shape) {
            if (!Hex._hexFromString(hex)) {
                const err = `shape entry "${hex}" must be a hex ("<#,#,#>")`;
                if (returnWarningInsteadOfThrow) {
                    return err;
                }
                throw new Error(err);
            }
        }
    }

    static assertIsSlice(slice, shape, returnWarningInsteadOfThrow = false) {
        if (!Array.isArray(slice)) {
            const err = "Slice must be an array";
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
        if (!Array.isArray(shape)) {
            const err = "Shape must be an array";
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
        if (slice.length !== shape.length - 1) {
            const err = `slice length (${slice.length}) must be ${
                shape.length - 1
            }`;
            if (returnWarningInsteadOfThrow) {
                return err;
            }
            throw new Error(err);
        }
        for (const tile of slice) {
            if (typeof tile !== "number") {
                const err = `slice entry "${tile}" must be a number`;
                if (returnWarningInsteadOfThrow) {
                    return err;
                }
                throw new Error(err);
            }
            const system = world.TI4.getSystemByTileNumber(tile);
            if (!system) {
                const err = `slice entry "${tile}" must be a known system tile`;
                if (returnWarningInsteadOfThrow) {
                    return err;
                }
                throw new Error(err);
            }
        }
    }
}

module.exports = { AbstractUtil };
