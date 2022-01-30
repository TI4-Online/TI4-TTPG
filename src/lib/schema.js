const Ajv = require("ajv")
const ajv = new Ajv({useDefaults: true})

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


const systemValidator = ajv.compile(systemSchema)

module.exports.systemSchemaValidator = systemValidator

