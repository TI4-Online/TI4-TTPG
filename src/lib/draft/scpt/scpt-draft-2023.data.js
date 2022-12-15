const SCPT_DRAFTS_2023 = [
    {
        name: "Qualifier",
        enabled: true,
        slices: "30,63,46,67,61|21,66,69,40,80|27,23,48,79,62|35,78,42,26,72|45,75,24,64,50|31,37,49,25,41|65,47,59,39,36",
        labels: [
            "Vorhallywood",
            "No Country for Hope's End",
            "Synecdoche, New Albion",
            "Lirta IV: The Voyage Home",
            "Three Little Devils",
            "Gravity's Blindside",
            "More-d'Or",
        ].join("|"),
        clock: 28800,
    },
    {
        name: "Prelims",
        enabled: false,
    },
    {
        name: "Semi-finals",
        enabled: false,
    },
    {
        name: "Finals",
        enabled: false,
    },
];

module.exports = { SCPT_DRAFTS_2023 };
