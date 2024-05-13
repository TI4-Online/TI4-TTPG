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
        enabled: true,
        slices: [
            "64,32,42,70,67", // 3
            "23,79,75,62,50", // 2
            "68,49,36,25,63", // 1
            "20,27,59,40,41", // 6
            "39,66,19,48,76", // 4
            "26,74,78,24,43", // 5
        ].join("|"),
        labels: ["SLICE", "SLICE", "SLICE", "SLICE", "SLICE", "SLICE"].join(
            "|"
        ),
        sounds: [
            "scpt-2024-semifinal-sounds/kirby_hiii_Sound_Effect.mp3", // white
            "scpt-2024-semifinal-sounds/Tim_Allen_s_home_Improvement_grunt_Sound_Effect.mp3", // blue
            "scpt-2024-semifinal-sounds/Bob_Wehadababyitsaboy_Sound_Effect.mp3", // purple
            "scpt-2024-semifinal-sounds/Wilhelm_Scream_Sound_Effect.mp3", // yellow
            "scpt-2024-semifinal-sounds/Gun_Shot_Sound_Effect.mp3", // red
            "scpt-2024-semifinal-sounds/Cat_surprised_to_hear_its_adopted_Sound_Effect.mp3", // green
        ].join("|"),
        factionCount: 6,
        // no clock for semis
    },
    {
        name: "Finals",
        enabled: true,
        slices: "34,22,67,77,66|41,32,47,59,69|35,25,44,73,49|40,75,42,24,26|39,76,62,43,64|27,50,72,79,65",
        labels: [
            "Slice 1",
            "Slice 2",
            "Slice 3",
            "Slice 4",
            "Slice 5",
            "Slice 6",
        ].join("|"),
        factionCount: 6,
        seedWithOnTableCards: true,
    },
];

module.exports = { SCPT_DRAFTS_2024 };
