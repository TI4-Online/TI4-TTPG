const fs = require("fs-extra");
const crypto = require("crypto");

const modSet =
    process.argv.length > 2 ? process.argv.slice(2) : ["base", "pok"];

const generateFactionSheet = (guid, mod, name, slug) => {
    const nsid = `sheet.faction:${mod}/${slug}`;
    return {
        Type: "Generic",
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
        Models: [
            {
                Model: "utility/factionsheet.obj",
                Offset: {
                    X: 0,
                    Y: 0,
                    Z: 0,
                },
                Scale: {
                    X: 1,
                    Y: 1,
                    Z: 0.399984,
                },
                Rotation: {
                    X: 0,
                    Y: 0,
                    Z: 0,
                },
                Texture: `locale/factionsheets/${mod}/${slug}.face.jpg`,
                NormalMap: "",
                ExtraMap: "",
                IsTransparent: false,
                CastShadow: true,
                UseOverrides: false,
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
                SurfaceType: "Cardboard",
            },
            {
                Model: "utility/factionsheet.obj",
                Offset: {
                    X: 0,
                    Y: 0,
                    Z: 0,
                },
                Scale: {
                    X: 1,
                    Y: 1,
                    Z: 0.399984,
                },
                Rotation: {
                    X: 180,
                    Y: 0,
                    Z: 0,
                },
                Texture: `locale/factionsheets/${mod}/${slug}.back.jpg`,
                NormalMap: "",
                ExtraMap: "",
                IsTransparent: false,
                CastShadow: true,
                UseOverrides: false,
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
                SurfaceType: "Cardboard",
            },
        ],
        Collision: [],
        SnapPointsGlobal: false,
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
        ZoomViewDirection: {
            X: 0,
            Y: 0,
            Z: 1,
        },
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
