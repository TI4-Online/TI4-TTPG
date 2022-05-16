const Ajv = require("ajv");

const PLANET_SCHEMA = {
    type: "object",
    properties: {
        localeName: { type: "string" },
        resources: { type: "integer" },
        influence: { type: "integer" },
        destroyed: { type: "boolean", default: false },
        trait: {
            type: "array",
            items: { enum: ["cultural", "hazardous", "industrial"] },
        },
        tech: {
            type: "array",
            items: { enum: ["yellow", "red", "blue", "green"] },
        },
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

const HYPERLANE_SCHEMA = {
    type: "array",
    items: {
        type: "array",
        items: { enum: [0, 1, 2, 3, 4, 5] },
        uniqueItems: true,
    },
    maxItems: 6,
    minItems: 6,
};

const WORMHOLE_SCHEMA = {
    type: "array",
    items: { enum: ["alpha", "beta", "gamma", "delta"] },
};

const SYSTEM_SCHEMA = {
    type: "object",
    properties: {
        tile: { type: "integer" },
        source: { type: "string" },
        home: { type: "boolean" },
        planets: { type: "array", items: PLANET_SCHEMA },
        wormholes: WORMHOLE_SCHEMA,
        wormholesFaceDown: WORMHOLE_SCHEMA,
        anomalies: {
            type: "array",
            items: {
                enum: ["asteroid field", "supernova", "nebula", "gravity rift"],
            },
        },
        offMap: { type: "boolean" },
        hyperlane: { type: "boolean" },
        hyperlaneFaceUp: HYPERLANE_SCHEMA,
        hyperlaneFaceDown: HYPERLANE_SCHEMA,
        img: { type: "string" },
        imgFaceDown: { type: "string" },
    },
    required: ["tile", "source", "img"],
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
