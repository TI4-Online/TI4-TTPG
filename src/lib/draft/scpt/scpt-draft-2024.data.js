const SCPT_DRAFTS_2024 = [
    {
        name: "Qualifier",
        enabled: true,
        slices: "32,66,68,63,39|26,76,49,19,41|64,35,65,22,79|50,37,45,61,36|25,73,78,59,62|72,75,80,21,40",
        labels: [
            "101 Dal Boothas",
            "Will",
            "Tharma $AMPERSAND Breg",
            "Yellow Slice Because It Has 2 Reds",
            "Give Me Integrated or Give Me Death",
            "Devil Went Down to Velnor",
        ].join("|"),
        factionCount: 6,
        clock: 28800,
    },
    {
        name: "Prelims",
        enabled: true,
        slices: "33,62,41,25,32|44,36,19,40,72|45,70,35,64,78|50,74,65,26,63|69,21,23,79,48|38,59,42,39,24",
        labels: [
            "Corneeqticut",
            "Lorxembourg",
            "Siigney",
            "Vorhalabama",
            "Düssaudorf",
            "New South Vails",
        ].join("|"),
        factionCount: 6,
        clock: 28800,
    },
    {
        name: "Semi-finals",
        enabled: false,
        slices: "",
        labels: [].join("|"),
        factionCount: 6,
        // no clock for semis
    },
    {
        name: "Finals",
        enabled: false,
        slices: "",
        labels: [
            "Slice 1",
            "Slice 2",
            "Slice 3",
            "Slice 4",
            "Slice 5",
            "Slice 6",
        ].join("|"),
        factionCount: 6,
    },
];

module.exports = { SCPT_DRAFTS_2024 };
