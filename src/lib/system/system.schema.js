const Ajv = require("ajv");

const PLANET_SCHEMA = {
    type: "object",
    properties: {
        localeName: { type: "string" },
        resources: { type: "integer" },
        influence: { type: "integer" },
        trait: { enum: ["cultural", "hazardous", "industrial"] },
        tech: { enum: ["yellow", "red", "blue", "green"] },
        legendary: { type: "boolean" },
        legendaryCard: { type: "string" },

        // Override default position/size.
        position: {
            type: "object",
            properties: {
                x: { type: "number" },
                y: { type: "number" },
            },
        },
        radius: { type: "number" },
    },
    required: ["localeName", "resources", "influence"],
};

const SYSTEM_SCHEMA = {
    type: "object",
    properties: {
        tile: { type: "integer" },
        home: { type: "boolean" },
        planets: { type: "array", items: PLANET_SCHEMA },
        wormholes: {
            type: "array",
            items: { enum: ["alpha", "beta", "gamma", "delta"] },
        },
        anomalies: {
            type: "array",
            items: {
                enum: ["asteroid field", "supernova", "nebula", "gravity rift"],
            },
        },
        offMap: { type: "boolean" },
        hyperlane: { type: "boolean" },
    },
    required: ["tile"],
};

// Lazy instantiate on first use.
let _systemValidator = false;

/**
 * Static class for validating raw system against schema.
 */
class SystemSchema {
    constructor() {
        throw new Error("Static only");
    }

    /**
     * Validate schema, returns error does not throw.
     *
     * @param {object} system attributes
     * @param {function} onError - takes the error as single argument
     * @returns {boolean} true if valid
     */
    static validate(system, onError) {
        // TODO XXX REMOVE THIS WHEN MACOS REQUIRE NODE_MODULES WORKS
        if (!Ajv) {
            console.warn("Ajv not available");
            return true;
        }
        if (!_systemValidator) {
            _systemValidator = new Ajv({ useDefaults: true }).compile(
                SYSTEM_SCHEMA
            );
        }
        if (!_systemValidator(system)) {
            (onError ? onError : console.error)(_systemValidator.errors);
            return false;
        }
        return true;
    }
}

module.exports = {
    SystemSchema,
};
