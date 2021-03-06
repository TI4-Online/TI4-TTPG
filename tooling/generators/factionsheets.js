const fs = require("fs-extra");
const crypto = require("crypto");

const modSet =
    process.argv.length > 2
        ? process.argv.slice(2)
        : ["base", "pok", "codex.vigil"];

const generateFactionSheet = (guid, mod, name, slug) => {
    const nsid = `sheet.faction:${mod}/${slug}`;

    // Use a common image for Keleres *AFTER* minting NSID
    if (slug.startsWith("keleres_")) {
        slug = "keleres";
    }

    return {
        Type: "Card",
        GUID: guid,
        Name: `Faction Sheet (${name})`,
        Metadata: nsid,
        CollisionType: "Ground",
        Friction: 0.7,
        Restitution: 0.3,
        Density: 1,
        SurfaceType: "Cardboard",
        Roughness: 1,
        Metallic: 0,
        PrimaryColor: {
            R: 255,
            G: 255,
            B: 255,
        },
        SecondaryColor: {
            R: 0,
            G: 0,
            B: 0,
        },
        Flippable: true,
        AutoStraighten: false,
        ShouldSnap: false,
        ScriptName: "",
        Blueprint: "",
        Models: [],
        Collision: [],
        SnapPointsGlobal: false,
        ZoomViewDirection: {
            X: 0,
            Y: 0,
            Z: 0,
        },
        Tags: [],
        FrontTexture: `locale/factionsheets/${mod}/${slug}.back.jpg`,
        BackTexture: `locale/factionsheets/${mod}/${slug}.face.jpg`,
        HiddenTexture: "",
        BackIndex: -2,
        HiddenIndex: -1,
        NumHorizontal: 1,
        NumVertical: 1,
        Width: 28,
        Height: 19.002,
        Thickness: 0.1,
        HiddenInHand: false,
        UsedWithCardHolders: false,
        CanStack: false,
        UsePrimaryColorForSide: false,
        FrontTextureOverrideExposed: false,
        AllowFlippedInStack: false,
        MirrorBack: true,
        Model: "Square",
        Indices: [0],
        CardNames: { 0: `Faction Sheet (${name})` },
        CardMetadata: { 0: nsid },
        CardTags: {},
        SnapPoints: [
            {
                X: -7.05,
                Y: -10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: -3.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: -3.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: 3.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: 3.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: 10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 2.35,
                Y: -10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: -10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 7.05,
                Y: -10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: -10.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 2.35,
                Y: -3.5,
                Z: 0.0999961,
                Range: 2.39998,
                SnapRotation: true,
                RotationOffset: 0,
            },
        ],
    };
};

const FACTIONS = {
    base: {
        arborec: {
            name: "Arborec",
        },
        creuss: {
            name: "Creuss",
        },
        hacan: {
            name: "Hacan",
        },
        jolnar: {
            name: "Jol-Nar",
        },
        l1z1x: {
            name: "L1Z1X",
        },
        letnev: {
            name: "Letnev",
        },
        mentak: {
            name: "Mentak",
        },
        muaat: {
            name: "Muaat",
        },
        naalu: {
            name: "Naalu",
        },
        nekro: {
            name: "Nekro",
        },
        norr: {
            name: "N'orr",
        },
        saar: {
            name: "Saar",
        },
        sol: {
            name: "Sol",
        },
        winnu: {
            name: "Winnu",
        },
        xxcha: {
            name: "Xxcha",
        },
        yin: {
            name: "Yin",
        },
        yssaril: {
            name: "Yssaril",
        },
    },
    pok: {
        argent: {
            name: "Argent Flight",
        },
        empyrean: {
            name: "Empyrean",
        },
        mahact: {
            name: "Mahact",
        },
        naazrokha: {
            name: "Naaz-Rokha",
        },
        nomad: {
            name: "Nomad",
        },
        ul: {
            name: "Ul",
        },
        vuilraith: {
            name: "Vuil-Raith",
        },
    },
    "codex.vigil": {
        keleres_argent: {
            name: "Council Keleres",
        },
        keleres_mentak: {
            name: "Council Keleres",
        },
        keleres_xxcha: {
            name: "Council Keleres",
        },
    },
};
Promise.all(
    modSet.map((theMod) => {
        return fs
            .ensureDir(`./assets/Templates/factionsheets/${theMod}`, 0o2775)
            .then(() => {
                return Promise.all([
                    ...Object.entries(FACTIONS[theMod]).map(
                        ([slug, { name }]) => {
                            const filename = `./assets/Templates/factionsheets/${theMod}/${slug}.json`;
                            const guid = crypto
                                .createHash("sha256")
                                .update(filename)
                                .digest("hex")
                                .substring(0, 32)
                                .toUpperCase();
                            return fs.writeFile(
                                filename,
                                JSON.stringify(
                                    generateFactionSheet(
                                        guid,
                                        theMod,
                                        name,
                                        slug
                                    ),
                                    null,
                                    "\t"
                                )
                            );
                        }
                    ),
                ]);
            });
    })
)
    .then(() => {
        console.log("done");
    })
    .catch((e) => {
        console.error(e);
    });
