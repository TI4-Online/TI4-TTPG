const fs = require("fs-extra");
const crypto = require("crypto");

const modSet =
    process.argv.length > 2 ? process.argv.slice(2) : ["base", "pok"];

const generateFactionSheet = (guid, mod, name, slug) => {
    const nsid = `sheet.faction:${mod}/${slug}`;
    return {
        Type: "Card",
        GUID: guid,
        Name: `Faction Sheet (${name})`,
        Metadata: nsid,
        CollisionType: "Regular",
        Friction: 0.7,
        Restitution: 0,
        Density: 0.5,
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
        SnapPoints: [
            {
                X: -7.05,
                Y: -10.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: -3.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: -3.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: 3.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: 3.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 2.35,
                Y: 3.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -7.05,
                Y: 10.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: -2.35,
                Y: 10.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 2.35,
                Y: 10.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
            {
                X: 7.05,
                Y: 10.5,
                Z: 0.25,
                Range: 3,
                SnapRotation: true,
                RotationOffset: 0,
            },
        ],
        ZoomViewDirection: {
            X: 0,
            Y: 0,
            Z: 0,
        },
        FrontTexture: `locale/factionsheets/${mod}/${slug}.face.jpg`,
        BackTexture: `locale/factionsheets/${mod}/${slug}.back.jpg`,
        HiddenTexture: "",
        BackIndex: 0,
        HiddenIndex: -1,
        NumHorizontal: 1,
        NumVertical: 1,
        Width: 28,
        Height: 19,
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
        CardNames: {},
        CardMetadata: {
            0: nsid,
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
        empyrian: {
            name: "Empyrian",
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
