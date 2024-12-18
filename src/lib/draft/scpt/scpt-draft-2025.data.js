const SCPT_DRAFTS_2025 = [
    {
        name: "Qualifier",
        enabled: true,
        slices: [
            "27,73,47,44,26", //
            "30,39,76,80,65",
            "42,64,75,72,49",
            "79,37,50,71,66",
            "34,41,70,78,25",
            "40,20,36,45,74",
        ].join("|"),
        labels: [
            "Will, again", //
            "Rigely field (Where the girls go out)",
            "Devil went back down to Velnor (He forgot something)",
            "Yellow slice because it has Hope's End",
            "Gravity's DOOT DOOT",
            "Viva Las Lorxembourg",
        ].join("|"),
        factionCount: 6,
        resizeToPlayerCount: true,
        clock: 28800,
    },
    {
        name: "Prelims",
        enabled: false,
        slices: "",
        labels: ["", "", "", "", "", ""].join("|"),
        factionCount: 6,
        clock: 28800,
    },
    {
        name: "Semi-finals",
        enabled: false,
        slices: "",
        labels: ["", "", "", "", "", ""].join("|"),
        factionCount: 6,
        // no clock for semis
    },
    {
        name: "Finals",
        enabled: false,
        slices: "",
        labels: ["", "", "", "", "", ""].join("|"),
        factionCount: 6,
        seedWithOnTableCards: true,
    },
];

module.exports = { SCPT_DRAFTS_2025 };
