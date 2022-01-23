const Ajv = require("ajv")
const ajv =  new Ajv({useDefaults: true})

const planetSchema = {
    type: "object",
    properties: {
        name: {type: "string"},
        resources: {type: "integer"},
        influence: {type: "integer"},
        trait: {enum: ["cultural", "hazardous", "industrial"]},
        tech: {enum: ["yellow", "red", "blue", "green"]},
        legendary: {type: "boolean"},
        legendaryCard: {type: "string"},
    },
    required: ["name", "resources", "influence"],
}

const systemSchema = {
    type: "object",
    properties: {
        tile: {type: "integer"},
        home: {type: "boolean"},
        planets: {oneOf: [planetSchema, {type: "array", items: planetSchema}]},
        wormhole: {enum: ["alpha", "beta", "gamma", "delta"]},
        anomalies: {enum: ["asteroid field", "supernova", "nebula", "gravity rift"]},
        offMap: {type: "boolean"},
        faction: {type: "string"},
        hyperlane: {type: "boolean"}
    },
    required: ["tile"],
}

const unitSchema = {
    type: "object",
    properties: {
        name: {type: "string"},
        cost: {type: "integer"},
        spaceCombat: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                requireSpace: {type: "boolean", default: true},
                extraHitsOn: { // jol-nar flagship
                    type: "object",
                    properties: {
                        count: {type: "integer"},
                        value: {type: "integer", maximum: 10}
                    },
                    required: ["count", "value"]
                },
                diceAsCount: {type: "boolean"} // winnu flagship
            },
            required: ["hit"]
        },
        move: {type: "integer"},
        capacity: {type: "integer"},
        ship: {type: "boolean"},
        sustainDamage: {type: "boolean"},
        bombardment: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                extraDice: {type: "integer"}
            },
            required: ["hit"]
        },
        groundCombat: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                anyPlanet: {type: "boolean"},
                requireGround: {type: "boolean", default: true}
            },
            required: ["hit"]
        },
        planetaryShield: {type: "boolean"},
        spaceConnon: {
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10},
                range: {type: "integer"},
                extraDice: {type: "integer"}
            },
            required: ["hit"]
        },
        structure: {type: "boolean"},
        production: {type: "integer"},
        antiFighterBarrage:{
            type: "object",
            properties: {
                dice: {type: "integer", default: 1},
                hit: {type: "integer", maximum: 10}
            },
            required: ["hit"]
        },
        disablePlanetaryShield: {type: "boolean"},
        override: {type: "string"},
        upgrade: {type: "string"}
    },
    required: ["name"]
}

const systemValidator = ajv.compile(systemSchema)
const unitValidator = ajv.compile(unitSchema)

module.exports.systemSchemaValidator = systemValidator
module.exports.unitSchemaValidator = unitValidator
