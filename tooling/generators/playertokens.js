const fs = require('fs-extra');
const uuid = require('uuid');

const generateUuid = () => uuid.v4().replace(/-/g, "").toUpperCase()

const modSet = process.argv.length > 2 ? process.argv.slice(2) : ["base", "pok"];

const generateCommand = (guid, mod, name, slug) => {
    return {
        "Type": "Generic",
        "GUID": guid,
        "Name": `Command (${name})`,
        "Metadata": "",
        "CollisionType": "Regular",
        "Friction": 0.7,
        "Restitution": 0.3,
        "Density": 1,
        "SurfaceType": "Plastic",
        "Roughness": 1,
        "Metallic": 0,
        "PrimaryColor":
        {
            "R": 255,
            "G": 255,
            "B": 255
        },
        "SecondaryColor":
        {
            "R": 0,
            "G": 0,
            "B": 0
        },
        "Flippable": true,
        "AutoStraighten": false,
        "ShouldSnap": true,
        "ScriptName": "",
        "Blueprint": "",
        "Models": [
            {
                "Model": "tokens/player-command.obj",
                "Offset":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Scale":
                {
                    "X": 1,
                    "Y": 1,
                    "Z": 1
                },
                "Rotation":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Texture": `global/tokens/${mod}/faction/${slug}.png`,
                "NormalMap": "",
                "ExtraMap": "global/tokens/faction_x.png",
                "IsTransparent": false,
                "CastShadow": true,
                "UseOverrides": true,
                "SurfaceType": "Plastic"
            }
        ],
        "Collision": [
            {
                "Model": "tokens/player-command.obj",
                "Offset":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Scale":
                {
                    "X": 1,
                    "Y": 1,
                    "Z": 1
                },
                "Rotation":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Type": "Convex"
            }
        ],
        "SnapPointsGlobal": false,
        "SnapPoints": [],
        "ZoomViewDirection":
        {
            "X": 0,
            "Y": 0,
            "Z": 0
        }
    }
}

const generateOwner = (guid, mod, name, slug) => {
    return {
        "Type": "Generic",
        "GUID": guid,
        "Name": `Owner (${name})`,
        "Metadata": "",
        "CollisionType": "Regular",
        "Friction": 0.7,
        "Restitution": 0.3,
        "Density": 1,
        "SurfaceType": "Plastic",
        "Roughness": 1,
        "Metallic": 0,
        "PrimaryColor":
        {
            "R": 255,
            "G": 255,
            "B": 255
        },
        "SecondaryColor":
        {
            "R": 0,
            "G": 0,
            "B": 0
        },
        "Flippable": false,
        "AutoStraighten": false,
        "ShouldSnap": true,
        "ScriptName": "",
        "Blueprint": "",
        "Models": [
            {
                "Model": "tokens/player-owner.obj",
                "Offset":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Scale":
                {
                    "X": 1,
                    "Y": 1,
                    "Z": 1
                },
                "Rotation":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Texture": `global/tokens/${mod}/faction/${slug}.png`,
                "NormalMap": "",
                "ExtraMap": "global/tokens/faction_x.png",
                "IsTransparent": false,
                "CastShadow": true,
                "UseOverrides": true,
                "SurfaceType": "Plastic"
            }
        ],
        "Collision": [
            {
                "Model": "tokens/player-owner.obj",
                "Offset":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Scale":
                {
                    "X": 1,
                    "Y": 1,
                    "Z": 1
                },
                "Rotation":
                {
                    "X": 0,
                    "Y": 0,
                    "Z": 0
                },
                "Type": "Convex"
            }
        ],
        "SnapPointsGlobal": false,
        "SnapPoints": [],
        "ZoomViewDirection":
        {
            "X": 0,
            "Y": 0,
            "Z": 0
        }
    }
}

const FACTIONS = {
    "base": {
        arborec: { name: "Arborec", ownGuid: "D0E7337CA6914EF2BBE7BD9DBC6FAFEB", cmdGuid: "B4F7F52733F34A3CBA08BC908540B9F6" },
        creuss: { name: "Creuss", ownGuid: "27AC26A9CE08479B980CB0C7D9A295B7", cmdGuid: "D661BC7FF7504B4FBE0684908CC838C9" },
        hacan: { name: "Hacan", ownGuid: "CB14F397225640FDB483FD67D1A1BDE1", cmdGuid: "A69B801AB2B64C93B75B16C454D3CEAF" },
        jolnar: { name: "Jolnar", ownGuid: "8C2247556C714C4AA6A253D5F763A82D", cmdGuid: "AFAA4314986544C395055B63E483028C" },
        l1z1x: { name: "L1Z1X", ownGuid: "D287077B83124747932BCB57B5321FDF", cmdGuid: "BA85B072A6004EDFB226D3C29246ED68" },
        letnev: { name: "Letnev", ownGuid: "F5DACED4D0AC44A2BF15035EBF0E6070", cmdGuid: "8BD69711265F4EF5BEA709E0FA54D1C3" },
        mentak: { name: "Mentak", ownGuid: "C16E6D0F4D3746F19FAB69E304C9A706", cmdGuid: "2F6FA211A89B48B3908C07E18F5847B8" },
        muaat: { name: "Muaat", ownGuid: "918E48C8A6404CD9BE1AE7AACDCE9B44", cmdGuid: "23F97AEAFFA841CB9B8883FB51DA9013" },
        naalu: { name: "Naalu", ownGuid: "DB9BBE13219748B5BB6E21637F294436", cmdGuid: "22C90126F9B649168C1CB65BD869F4F4" },
        nekro: { name: "Nekrovirus", ownGuid: "64265A01F4264D1D943361A8EBFB2435", cmdGuid: "19EC4C2D863243E9AC1BAC1BC17AC9C3" },
        saar: { name: "Saar", ownGuid: "A11ADE74A782409B82D7F5A9452ED43B", cmdGuid: "85B540BC0C25475984ABE2C8D97A6420" },
        sardakk: { name: "Sardakk'Nor", ownGuid: "7BC8604ABD2C4FBE9CF65ABAB97B10A3", cmdGuid: "E39AC952A48F4BBFAAB7D12DB00F9C70" },
        sol: { name: "Sol", ownGuid: "277CF847C53940628149FA6C8A0FD402", cmdGuid: "C7F21415766341C7A5DF8390876914AC" },
        winnu: { name: "Winnu", ownGuid: "E5796A31266F41E3B22158A7A7941DC8", cmdGuid: "0F3EEAB9F87942858376A39F724CDB02" },
        xxcha: { name: "Xxcha", ownGuid: "931435667E0B44C88B09039627C95E7F", cmdGuid: "1E0315C9C0B4430E88E24E3A73DB0417" },
        yin: { name: "Yin", ownGuid: "C132A1BA4DF7438D8644CB3AF45497F1", cmdGuid: "901AA4C3196448FA8CADD3ED201E683F" },
        yssaril: { name: "Yssaril", ownGuid: "3901FA582A2C4EA78642B75B219B45DD", cmdGuid: "F8A80B4C387A4793B6BCDB40367373CD" },
    },
    "pok": {
        argent: { name: "Argent Flight", ownGuid: "CEDE596203A04AA99AB82EA42E4FBBE2", cmdGuid: "943CD74201B24A6E9C56D236515ADFB4" },
        empyrian: { name: "Empyrian", ownGuid: "F7EC680D442F4FEA9FC7156A81991741", cmdGuid: "51F262AC33AA49CF9044A7F31B30BDC2" },
        mahact: { name: "Mahact", ownGuid: "884F628DB92F433DBCA2EC895D9454BA", cmdGuid: "3877ED7E1F754BA8880370C64359261E" },
        nazrokha: { name: "Naz-Rokha", ownGuid: "36325EA7599F469A9C3C5397D6BB7262", cmdGuid: "7F3923F9715A47B9B48C99CB5A4E83E1" },
        nomad: { name: "Nomad", ownGuid: "4B1382D778764F8E95E476C34DC72CB8", cmdGuid: "A2A499832CB74349964431C208E0BD2F" },
        titans: { name: "Titans", ownGuid: "C437D1017ACA4C4EB6264B03C05AE2E6", cmdGuid: "AA0D94CC53004E6E9EA7703EDDFB9E33" },
        vuilraith: { name: "Vuil-Raith", ownGuid: "9A27D698099742E6980EF14947C3533B", cmdGuid: "F698C0B2F0BA460A949AC81BB1C10D69" },
    }
}

Promise.all(
    modSet.map((theMod) => {
        return fs.ensureDir(`./assets/Templates/tokens/${theMod}/faction`, 0o2775).then(() => {
            return Promise.all([
                ...Object.entries(FACTIONS[theMod]).map(([slug, { name, cmdGuid }]) => {
                    const guid = cmdGuid ? cmdGuid : generateUuid();
                    return fs.writeFile(`./assets/Templates/tokens/${theMod}/faction/${guid}.json`, JSON.stringify(generateCommand(guid, theMod, name, slug), null, "\t"))
                }),
                Object.entries(FACTIONS[theMod]).map(([slug, { name, ownGuid }]) => {
                    const guid = ownGuid ? ownGuid : generateUuid();
                    return fs.writeFile(`./assets/Templates/tokens/${theMod}/faction/${guid}.json`, JSON.stringify(generateOwner(guid, theMod, name, slug), null, "\t"))
                })
            ])
        })
    })
).then(() => {
    console.log("done");
}).catch((e) => {
    console.error(e);
})
