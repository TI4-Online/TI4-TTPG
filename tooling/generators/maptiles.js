const fs = require('fs-extra');
const uuid = require('uuid');

const generateUuid = () => uuid.v4().replace(/-/g, "").toUpperCase()

const COLORS = {
    hazard: {
        "R": 230,
        "G": 90,
        "B": 58
    },
    homeworld: {
        "R": 145,
        "G": 251,
        "B": 133
    },
    regular: {
        "R": 99,
        "G": 185,
        "B": 255
    },
    special: {
        "R": 255,
        "G": 255,
        "B": 255
    }
}

const TILES = {
    "base": {
        "regular": {
            "019": { guid: "486525D88A2F4722ACCA265D6CD4AD05" },
            "020": { guid: "F384D89AFD3F4534B9567B6578DE576F" },
            "021": { guid: "710503D28ED8486CBADC7883CBB3024D" },
            "022": { guid: "00D3C322F17E47B4A8AEE03846F60E8A" },
            "023": { guid: "298CDBD1A4414778B7C706BE6AA2BED2" },
            "024": { guid: "DA2A9FC7B2214614BA0BEF4A9FDB7872" },
            "025": { guid: "B3B9138D3F2A45C199777CD70663DAE7" },
            "026": { guid: "652C43A2B75E4B769F56C311FEC4F54E" },
            "027": { guid: "2FC74B8261F54CC59B97D0A2153AEDD6" },
            "028": { guid: "269805E6EB814DEEB179FE3120ACD6BA" },
            "029": { guid: "01D692174D1B48CCBE73288808115AE0" },
            "030": { guid: "49B21A13619A40D4B689AA210790C47F" },
            "031": { guid: "20D42CE9FFA347958EB494CBF6D280DB" },
            "032": { guid: "79187EF4BDAA49F484869F884A6C2FC3" },
            "033": { guid: "6E0DE6B307C345BEA7C40AFC833DB9C4" },
            "034": { guid: "672250347FF94303BFD451CAE3A073B7" },
            "035": { guid: "61920B1E233D493984B3E9CB08162BD2" },
            "036": { guid: "D53C4DF0CE454D96A0DEC85191D1E1F3" },
            "037": { guid: "0C345E10BB53423086D6E6276988AEE6" },
            "038": { guid: "2664FC3FFAA24F42AB78C27A0234BB57" },
        },
        "hazard": {
            "039": { guid: "8195FF33918C4C55942EE4F00DACEC90", noLang: true },
            "040": { guid: "4255D793CC924DD9B5592AB7D9627F48", noLang: true },
            "041": { guid: "B1C3028BD9994093B0D897719D6F9D7C", noLang: true },
            "042": { guid: "F0B83B88713F4D1C97B564240D93444B", noLang: true },
            "043": { guid: "5A5FB4978C884D3ABEEFC5F8B1AEE4B7", noLang: true },
            "044": { guid: "CCC9A07EED8B4FBA95861499CA93C65A", noLang: true },
            "045": { guid: "8EBDAB527CAA4CAD9CB2076F7C526008", noLang: true },
            "046": { guid: "9679B60C009741008D53D2957F5B43D7", noLang: true },
            "047": { guid: "B6EBCB3CDF584442B9A2D69CC9321FE9", noLang: true },
            "048": { guid: "C7D0856CB35645DCBF471A9D38614FC8", noLang: true },
            "049": { guid: "196BF158D6E94203BC0AEFCC38EDE9CA", noLang: true },
            "050": { guid: "B0FB9877565A49C2BCED69B976A9E154", noLang: true },
        },
        "homeworld": {
            "001": { guid: "DE3527F84B594186B4FE56418BC021F7" },
            "002": { guid: "7D7AFDD1441844BC952D0D96B06B24DA" },
            "003": { guid: "5876803615FC40F6BD3321BD4393F3A8" },
            "004": { guid: "7F724431BAA644FBAB8760891D345DBD" },
            "005": { guid: "CBBCC32B7DB84D08B66CA9BB65036763" },
            "006": { guid: "3E02A9F9891B47A89370BFC7EE760F47" },
            "007": { guid: "380AB05EF9ED45CE86BA9DB8D736CF83" },
            "008": { guid: "14C4DA0CA5C04240B62723C6C771D0DC" },
            "009": { guid: "093975F82C6D486D8A514CA535F34402" },
            "010": { guid: "93B693CE52B7403686CA27F2B6170C05" },
            "011": { guid: "BD98A516DB3B4829BFAC98DE3AC9847C" },
            "012": { guid: "271882E0EB954614913C6F5EA58B7A25" },
            "013": { guid: "7CAEF95C36B945A3A5319363231DA95B" },
            "014": { guid: "9D675067967E4A9A8F46EF6ECA9D5628" },
            "015": { guid: "CB6D57A4F05E4B7398B6A2F528D0D97D" },
            "016": { guid: "38894D21559A4E5BB45BD76FF22AFB2F" },
            "017": { guid: "1A54BFBA7E184176AEC45C8BF4B9238C" },
        },
        "special": {
            "018": {
                guid: "0E8A6E46AFF24A61914C83EAF6399857",
                name: "Mecatol Rex",
                reverseTexture: `locale/tiles/base/special/tile_018.jpg`
            },
            "051": {
                guid: "AE00A0B5DA25455E8DC2C6C1B1F8F297",
                obverseModel: "tiles/standalone-obverse.obj",
                reverseModel: "tiles/standalone-reverse.obj",
                reverseTexture: `global/tiles/reverse_homeworld_c.png`,
                reverseExtra: `global/tiles/reverse_homeworld_x.png`,
                reverseColor: COLORS.homeworld
            }
        },
    },
    "pok": {
        "regular": {
            "059": { guid: "95A537D9978C46E2ACEAB20AE3054529" },
            "060": { guid: "7600AA2CA52A4CA084BEAC4AB84D9474" },
            "061": { guid: "A3D7AEB7ACC440CAB8090EFAE794B1E6" },
            "062": { guid: "9F927FD9E9DB49DC92D2D37573056C59" },
            "063": { guid: "D4CEBD199BAA48F4854F9200D7E4A3F1" },
            "064": { guid: "E4E48E114C9E4868BAF85D6D6242A5D2" },
            "065": { guid: "413038A26C53432093C2389028CF0EC3" },
            "066": { guid: "74D8845508D142F9ADB8367A92F4B66F" },
            "069": { guid: "F5DB58B078F6432FB8A422CCB047FE81" },
            "070": { guid: "7A66C6A0B13A446CBA01812647A8CEA5" },
            "071": { guid: "C27551461C1A41B6B840E7787C713F20" },
            "072": { guid: "093A03CB3D3E432EA6374B81E2001E27" },
            "073": { guid: "9561D7A9EB8848FEB558E5B3BABBB05E" },
            "074": { guid: "67FF193ED1644412AAB632401F1E44ED" },
            "075": { guid: "87C1DBAA6B3E4E98B13DC69FBB320277" },
            "076": { guid: "59921407A24F4B1BA42494370EBAE879" },
        },
        "hazard": {
            "067": { guid: "6746AC4ABDC04862BB0C02635EF76506" },
            "068": { guid: "03D42542B4F4423D85659850A732297E" },
            "077": { guid: "D5E44F2314924C35B232A74194352C1D", noLang: true },
            "078": { guid: "984CE119D2254822BCE96125B932DC0E", noLang: true },
            "079": { guid: "48155B11EC204F95BC6C8E8A62563C14", noLang: true },
            "080": { guid: "A14791A9164F493C81F70F92FF1353B6", noLang: true },
        },
        "hyperlane": {
            "083": { guid: "EA945EFF89FE4D48A3722E70FE91EFB4", obverseTexture: `global/tiles/pok/hyperlane/tile_083_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_083_r.jpg` },
            "084": { guid: "04F562C521794710B41D190E6B277D55", obverseTexture: `global/tiles/pok/hyperlane/tile_084_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_084_r.jpg` },
            "085": { guid: "4F0ACAD64F3C455BAE62225FF6C3850F", obverseTexture: `global/tiles/pok/hyperlane/tile_085_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_085_r.jpg` },
            "086": { guid: "F4D5B1B9DB264405A492E277F60C8662", obverseTexture: `global/tiles/pok/hyperlane/tile_086_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_086_r.jpg` },
            "087": { guid: "3F41E11B0C4C49468661D5A8C0C3B659", obverseTexture: `global/tiles/pok/hyperlane/tile_087_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_087_r.jpg` },
            "088": { guid: "35BE0CAA2E4B4893B05B0642BD68E88F", obverseTexture: `global/tiles/pok/hyperlane/tile_088_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_088_r.jpg` },
            "089": { guid: "8E938A20B4B442AE9655137CF3660E30", obverseTexture: `global/tiles/pok/hyperlane/tile_089_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_089_r.jpg` },
            "090": { guid: "C928C3FB88C04D84A3C6E0E871145B05", obverseTexture: `global/tiles/pok/hyperlane/tile_090_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_090_r.jpg` },
            "091": { guid: "0F4F7816363044D1B21EF2AA647D260D", obverseTexture: `global/tiles/pok/hyperlane/tile_091_o.jpg`, reverseTexture: `global/tiles/pok/hyperlane/tile_091_r.jpg` },
        },
        "homeworld": {
            "052": { guid: "FA561A091AA94C2881E4EF8EFF5D8009" },
            "053": { guid: "EAE70D5AA35D4EFBBECA54FA7D990D50" },
            "054": { guid: "A3B8E4425F774D5FA813C38A673BDBBD" },
            "055": { guid: "C5D0E15769B447F88696594AC48ADC40" },
            "056": { guid: "C911275C44B74B0C92252864B4C7FB8A" },
            "057": { guid: "45D888DDD1BB47839F10D6D215CF5FD6" },
            "058": { guid: "A59AEE566273429AAC9A32500F674896" },
        },
        "special": {
            "081": { guid: "1EFD655740B44AF1A6F75C9B6E99A018", noLang: true, reverseTexture: "global/reverse_homeworld_c.jpg", reverseExtra: "global/reverse_homeworld_x.jpg", reverseColor: COLORS.homeworld },
            "082": {
                guid: "541FFEC05B05424BAE1B225D9765598D",
                obverseModel: "tiles/standalone-obverse.obj",
                obverseTexture: "locale/tiles/pok/special/tile_082_o.jpg",
                reverseModel: "tiles/standalone-reverse.obj",
                reverseTexture: "locale/tiles/pok/special/tile_082_r.jpg"
            },
        }
    },
    "discordant_stars": {
        "homeworld": {
            "3201": { guid: "F1E6206B09454402B9A5E52B1934BAD6" },
            "3202": { guid: "71C6CF8E8326420B9B72B5BD0329A173" },
            "3203": { guid: "21373514204A409F8A834E1FDCC19A3C" },
            "3204": { guid: "9AFB10D005A240F7B09FE5D30CA9FBA0" },
            "3205": { guid: "47C8E5F3D2A0498E9DBC3FC7EF80E824" },
            "3206": { guid: "9F83BC9B59F1461B96F525398E21C400" },
            "3207": { guid: "615DC76F745F4D668B502F5DDB91D27D" },
            "3208": { guid: "152C3545E9F246048D0215F7CBA63D6D" },
            "3209": { guid: "8371CA8B6CFE426D89E58B6A96B48098" },
            "3210": { guid: "B50C67991C214A08B5CDAB1E3C121044" },
            "3211": { guid: "330FC1258CCF4E51A7D641FC4218049F" },
            "3212": { guid: "2EC81B92A6974C8FA215E62235671284" },
            "3213": { guid: "1CDA602307374660B9D29ABE74274553" },
            "3214": { guid: "3B006A999C5D4340B8346BFB841BADA3" },
            "3215": { guid: "0D10F9991C184DBA89140C252A343BD3" },
            "3216": { guid: "072DCEE6DDAB44E3BA26706A31EE0E45" },
            "3217": { guid: "C4C4D351119540A7AEC663965FE2837B" },
            "3218": { guid: "B1BB3A41C2B845A5BE4CE5DE2F0E7F7D" },
            "3219": { guid: "FFA2046A9E2C4400935E2C3404D2B68C" },
            "3220": { guid: "FB1B4ACEA6C840DDBB341E553419F7C7" },
            "3221": { guid: "7BB5522CA5F64BFAB43A08CD06949AA3" },
            "3222": { guid: "03E16DFF2D1D40B1BBB054F55BB8064F" },
            "3223": { guid: "F61083209FB643A395790E821767AE4D" },
            "3224": { guid: "819715212DA746268C281C3B2259FCBE" },
        },
        "special": {
            "3225": {
                guid: "CFB133FD79F5450AAEED1281FCB25D26",
                obverseTexture: `locale/tiles/discordant_stars/special/tile_3225_o.jpg`,
                reverseTexture: `locale/tiles/discordant_stars/special/tile_3225_r.jpg`
            }
        }
    }
}

const modSet = (process.argv.length > 2 ? process.argv.includes("*") ? Object.keys(TILES) : process.argv.slice(2).filter(a => Object.keys(TILES).includes(a)) : ["base", "pok"]);

const generateTile = (guid, mod, mapId, type = "regular", details = {}) => {

    const scripteId = `tile.system:${(mod !== "base" && mod !== "pok") ? "homebrew." : ""}${mod}/${parseInt(mapId)}`;
    return {
        "Type": "Generic",
        "GUID": guid,
        "Name": details.name ? details.name : `Tile ${mapId}`,
        "Metadata": scripteId,
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
                "Model": details.obverseModel ? details.obverseModel : "tiles/basic.obj",
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
                "Texture": details.obverseTexture ? details.obverseTexture : `${details.noLang ? "global" : "locale" }/tiles/${mod}/${type}/tile_${mapId}.jpg`,
                "NormalMap": "",
                "ExtraMap": `global/tiles/obverse_x.png`,
                "IsTransparent": false,
                "CastShadow": true,
                "UseOverrides": true,
                "SurfaceType": "Plastic"
            },
            {
                "Model": details.reverseModel ? details.reverseModel : "tiles/basic.obj",
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
                    "X": 180,
                    "Y": 0,
                    "Z": 0
                },
                "Texture": details.reverseTexture ? details.reverseTexture : `global/tiles/reverse_${type}_c.png`,
                "NormalMap": "",
                "ExtraMap": details.reverseExtra ? details.reverseExtra : details.reverseTexture ? `global/tiles/obverse_x.png` : `global/tiles/reverse_${type}_x.png`,
                "IsTransparent": false,
                "CastShadow": true,
                "UseOverrides": false,
                "Roughness": 1,
                "Metallic": 0,
                "PrimaryColor": details.reverseColor ? details.reverseColor : details.reverseTexture ? { "R": 255, "G": 255, "B": 255} : COLORS[type],
                "SecondaryColor":
                {
                    "R": 0,
                    "G": 0,
                    "B": 0
                },
                "SurfaceType": "Plastic"
            }
        ],
        "Collision": [
            {
                "Model": "tiles/collider.obj",
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
            "Z": 1.0
        }
    }
}

Promise.all(
    modSet.map((theMod) => {
        return fs.ensureDir(`./assets/Templates/tiles/${theMod}`, 0o2775).then(() => {
            return Promise.all(
                Object.keys(TILES[theMod]).map(e => fs.ensureDir(`./assets/Templates/tiles/${theMod}/${e}`))
            ).then(() => {
                return Promise.all(
                    Object.entries(TILES[theMod]).reduce((acc, [type, def]) => {
                        return [...acc, ...Object.entries(def).map(([mapId, details]) => {
                            const guid = details.guid ? details.guid : generateUuid();
                            return fs.writeFile(`./assets/Templates/tiles/${theMod}/${type}/${guid}.json`, JSON.stringify(generateTile(guid, theMod, mapId, type, details), null, "\t"))
                        })]
                    }, [])
                )
            })
        })
    })
).then(() => {
    console.log("done");
}).catch((e) => {
    console.error(e);
})
