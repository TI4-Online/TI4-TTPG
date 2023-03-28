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
        enabled: true,
        slices: "63,40,72,46,68|45,64,34,62,49|36,25,24,50,41|48,22,66,79,32|39,61,59,43,71|42,26,73,78,21|47,70,65,44,19",
        labels: [
            "Gone Girl",
            "Big-Lore, Not Four",
            "DOOT DOOT!",
            "Ginger As She Goes",
            "It's Finger",
            "It's Pronounced Kay All Dree",
            "It's Pronounced Celery",
        ].join("|"),
        clock: 28800,
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
