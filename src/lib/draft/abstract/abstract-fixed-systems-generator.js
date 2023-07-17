const assert = require("../../../wrapper/assert-wrapper");

class AbstractFixedSystemsGenerator {
    static parseCustomFixedSystems(custom, fixedCount, errors) {
        assert(typeof custom === "string");
        assert(Array.isArray(errors));

        const descriminator = "fixed=";

        const parts = custom
            .split("&")
            .map((part) => {
                return part.trim().toLowerCase();
            })
            .filter((part) => {
                return part.startsWith(descriminator);
            });
        if (parts.length === 0) {
            return false; // none given
        }

        let items = parts[0]
            .substring(descriminator.length)
            .split(",")
            .map((item) => {
                return item.trim();
            });

        // Validate (and convert to numbers).
        if (items.length !== fixedCount) {
            const err = `fixed system count (${items.length}) does not match required count (${fixedCount})`;
            errors.push(err);
        }
        const result = [];
        for (const item of items) {
            const tile = Number.parseInt(item);
            if (Number.isNaN(tile)) {
                errors.push(`Fixed system entry "${item}" is not a number`);
            } else {
                result.push(tile);
            }
        }

        return result;
    }

    getFixedHexes() {
        throw new Error("subclass must override this");
    }

    generateFixedSystems() {
        throw new Error("subclass must override this");
    }
}

module.exports = { AbstractFixedSystemsGenerator };
