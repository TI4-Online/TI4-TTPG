const ATTACHMENTS = [
    {
        localeName: "token.attachment.dmz",
    },
    {
        localeName: "token.attachment.rich_world",
        faceUp: { resources: 1 },
        faceDown: { resources: 1 },
    },
    {
        localeName: "token.attachment.mining_world",
        faceUp: { resources: 2 },
        faceDown: { resources: 2 },
    },
    {
        localeName: "token.attachment.tomb_of_emphidia",
        faceUp: { influence: 1 },
        faceDown: { influence: 1 },
    },
    {
        localeName: "token.attachment.paradise_world",
        faceUp: { influence: 2 },
        faceDown: { influence: 2 },
    },
    {
        localeName: "token.attachment.lazax_survivors",
        faceUp: { resources: 1, influence: 2 },
        faceDown: { resources: 1, influence: 2 },
    },
    {
        localeName: "token.attachment.dyson_sphere",
        faceUp: { resources: 2, influence: 1 },
        faceDown: { resources: 2, influence: 1 },
    },
    {
        localeName: "token.attachment.nano_forge",
        faceUp: { resources: 2, influence: 2, legendary: true },
        faceDown: { resources: 2, influence: 2, legendary: true },
    },
    {
        localeName: "token.attachment.cybernetic_facility",
        faceUp: { resources: 1, influence: 1 },
        faceDown: { tech: ["yellow"] },
    },
    {
        localeName: "token.attachment.biotic_facility",
        faceUp: { resources: 1, influence: 1 },
        faceDown: { tech: ["green"] },
    },
    {
        localeName: "token.attachment.propulsion_facility",
        faceUp: { resources: 1, influence: 1 },
        faceDown: { tech: ["blue"] },
    },
    {
        localeName: "token.attachment.warfare_facility",
        faceUp: { resources: 1, influence: 1 },
        faceDown: { tech: ["red"] },
    },
    {
        localeName: "token.attachment.terraform",
        faceUp: {
            resources: 1,
            influence: 1,
            traits: ["industrial", "hazardous", "cultural"],
        },
        faceDown: {
            resources: 1,
            influence: 1,
            traits: ["industrial", "hazardous", "cultural"],
        },
    },
    {
        // TODO: include space cannon?
        localeName: "token.attachment.geoform",
        faceUp: {
            resources: 3,
            influence: 3,
        },
        faceDown: {
            resources: 3,
            influence: 3,
        },
    },
];

module.exports = { ATTACHMENTS };
