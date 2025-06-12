"use strict";
// Create decks from prebuild card assets.  Run with "ALL" to build all decks,
// or name one or more of the deck ids below (e.g. "card.action").
//
// Example usage:
// % node tooling/generators/cardsheets.js ALL

const fs = require("fs-extra");
const klaw = require("klaw"); // walk file system
const path = require("path");
const sharp = require("sharp");
const assert = require("assert");
const crypto = require("crypto");

const KEEP_HOMEBREW = false;

const SRC_TEXTURES_DIR = path.normalize("prebuild/Textures/");
const DST_TEXTURES_DIR = path.normalize("assets/Textures/");
const DST_TEMPLATES_DIR = path.normalize("assets/Templates/");

const CARD_SCALE = 0.68;

// TTPG has an 8K limit.  4K is actually a good sweet spot, lower waste vs 8K.
const MAX_SHEET_DIMENSION = 4096;

// Do the work, but do not write any files.
const TRIAL_RUN = false;

// "American Mini" is 41x63mm, but 500x750 aspect ratio is 42x63mm.
const CARD_SIZE = {
    LANDSCAPE: { w: 6.3, h: 4.2 },
    PORTRAIT: { w: 4.2, h: 6.3 },
    FACTION_REFERENCE: { w: 8.8, h: 6.3 },
    EVENT: { w: 12.9, h: 7.6 },
};

const DECKS = {
    "card.action": {
        name: "Actions",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.agenda": {
        name: "Agenda",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.alliance": {
        name: "Alliance",
        sharedBack: false,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.event": {
        name: "Events",
        sharedBack: true,
        size: CARD_SIZE.EVENT,
    },
    "card.exploration.cultural": {
        name: "Cultural Exploration",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.exploration.hazardous": {
        name: "Hazardous Exploration",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.exploration.industrial": {
        name: "Industrial Exploration",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.exploration.frontier": {
        name: "Frontier Exploration",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.faction_reference": {
        name: "Faction References",
        sharedBack: true,
        size: CARD_SIZE.FACTION_REFERENCE,
    },
    "card.faction_token": {
        name: "Faction Tokens",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.leader": {
        name: "Leaders",
        sharedBack: false,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.legendary_planet": {
        name: "Legendary Planets",
        sharedBack: false,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.planet": {
        name: "Planets",
        sharedBack: false,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.promissory": {
        name: "Promissory",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.objective.public_1": {
        name: "Public Objectives I",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.objective.public_2": {
        name: "Public Objectives II",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.relic": {
        name: "Relics",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.objective.secret": {
        name: "Secret Objectives",
        sharedBack: true,
        size: CARD_SIZE.PORTRAIT,
    },
    "card.technology.blue": {
        name: "Technology (Blue)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.technology.green": {
        name: "Technology (Green)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.technology.yellow": {
        name: "Technology (Yellow)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.technology.red": {
        name: "Technology (Red)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.technology.unit_upgrade": {
        name: "Technology (Unit Upgrade)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
    "card.technology.unknown": {
        name: "Technology (Unknown)",
        sharedBack: true,
        size: CARD_SIZE.LANDSCAPE,
    },
};

class Nsid {
    static parse(nsid) {
        assert(typeof nsid == "string");
        const m = nsid.match(/^([^:]*):([^/]*)\/(.*)$/);
        assert(m);
        return {
            type: m[1],
            source: m[2],
            name: m[3],
        };
    }
    static build(type, source, name) {
        assert(typeof type == "string");
        assert(typeof source == "string");
        assert(typeof name == "string");
        return `${type}:${source}/${name}`;
    }
}

/**
 * Collect all card metadata access in one place.
 */
class CardData {
    constructor(nsid, locale) {
        assert(typeof nsid == "string");
        assert(typeof locale == "string");

        this._nsid = nsid;
        this._locale = locale;

        this._nsidValues = Nsid.parse(nsid);
        assert(this._nsidValues);

        // Outsiders can stuff data here (careful!)
        this.extra = {};
    }

    nsid() {
        return this._nsid;
    }

    nsidType() {
        return this._nsidValues.type;
    }

    nsidSource() {
        return this._nsidValues.source;
    }

    nsidName() {
        return this._nsidValues.name;
    }

    locale() {
        return this._locale;
    }

    cardNameLocale() {
        if (!this._cardNameLocale) {
            // At the moment name is in the json file next to the card face image.
            let face = this.face();
            assert(face.endsWith(".jpg"));
            face = face.slice(0, face.length - 4);
            if (face.endsWith(".face")) {
                face = face.slice(0, face.length - 5);
            }
            const jsonFilename = face + ".json";
            const rawdata = fs.readFileSync(jsonFilename);
            const json = JSON.parse(rawdata);
            this._cardNameLocale = json.name;
            assert(this._cardNameLocale);
        }
        return this._cardNameLocale;
    }

    face() {
        if (!this._face) {
            // Representative government is a little funky, two versions with same name but different source.
            // For now just force the correct one for PoK.
            if (this._nsid === "card.agenda:pok/representative_government") {
                this._face = AssetFilenames.cardImage(
                    "card.agenda:pok/representative_government_pok",
                    "face",
                    this._locale
                );
                assert(this._face);
                return this._face;
            }

            this._face = AssetFilenames.cardImage(
                this._nsid,
                "face",
                this._locale
            );
            assert(this._face);
        }
        return this._face;
    }

    back() {
        if (!this._back) {
            this._back = AssetFilenames.cardImage(
                this._nsid,
                "back",
                this._locale
            );
            assert(this._back);
        }
        return this._back;
    }

    isFaceGlobal() {
        const face = this.face();
        const globalPrefix = path.join(SRC_TEXTURES_DIR, "global");
        return face.startsWith(globalPrefix);
    }

    isBackGlobal() {
        const back = this.back();
        const globalPrefix = path.join(SRC_TEXTURES_DIR, "global");
        return back.startsWith(globalPrefix);
    }

    isSharedBack() {
        const face = this.face();
        const back = this.back();
        return path.dirname(face) !== path.dirname(back);
    }

    async size() {
        if (!this._size) {
            const imgFile = this.face();
            const stats = await sharp(imgFile).metadata();
            assert(stats);
            const w = Math.floor(stats.width * CARD_SCALE);
            const h = Math.floor(stats.height * CARD_SCALE);
            this._size = {
                w,
                h,
                str: `${w}x${h}`,
            };
        }
        return this._size;
    }
}

/**
 * Find ids matching the pattern, searching the per-card json blobs.
 *
 * @param {string} pattern
 * @return {Promise} object mapping nsid string to card metadata json
 */
function getMatchingCards(pattern, locale) {
    assert(typeof pattern === "string");
    assert(typeof locale === "string");

    return new Promise((resolve, reject) => {
        const re = new RegExp(pattern);
        let nsidToJson = {};
        klaw(path.join(SRC_TEXTURES_DIR, locale))
            .on("data", (item) => {
                if (item.path.endsWith(".json")) {
                    const rawdata = fs.readFileSync(item.path);
                    const json = JSON.parse(rawdata);
                    const nsid = json.id;
                    assert(nsid);
                    if (
                        !KEEP_HOMEBREW &&
                        (nsid.includes(":homebrew") ||
                            nsid.includes(":franken.homebrew"))
                    ) {
                        return;
                    }
                    if (nsid.match(re)) {
                        assert(!nsidToJson[nsid]);
                        nsidToJson[nsid] = json;
                    }
                }
            })
            .on("error", (err, item) => {
                reject(err);
            })
            .on("end", () => {
                resolve(nsidToJson);
            });
    });
}

class AssetFilenames {
    /**
     * Find the card image file inside the prebuild dir.
     *
     * Card faces are always at the id's path, as either x.face.jpg or x.jpg.
     * Card backs may be dir/x.back.jpg, or dir.back.jpg upward (shared back).
     *
     * Scan locale first, then try global.
     *
     * @param {string} nsid - "type:source/name" encoding
     * @param {string} side - either "face" or "back"
     * @param {string} locale - localization
     * @returns {string} image filename, relative to package root.
     */
    static cardImage(nsid, side, locale, recursed = false) {
        assert(typeof nsid === "string");
        assert(nsid.startsWith("card"));
        assert(side === "face" || side == "back");
        assert(typeof locale === "string");

        const nsidValues = Nsid.parse(nsid);
        assert(nsidValues);

        // Branch locale before entering deck name space.  Also set dirs to be:
        // (1) relative to asset dir, (2) attach the deck path.
        const dirValues = [locale, "global"].map((dir) => {
            // nsidValues.type is "card.action", "card.exploration.cultural", etc.
            return path.join(
                SRC_TEXTURES_DIR,
                dir,
                ...nsidValues.type.split(".")
            );
        });

        // Some cards appear multiple times with the same image (e.g.,
        // "card.exploration.cultural.cultural_relic_fragment.1", ".2", etc).
        // In those cases, if a non-1 numbered name is missing use 1 instead.
        const nameValues = [nsidValues.name];
        const m = nsidValues.name.match(/^(.*)\.([0-9]+)$/);
        if (m) {
            const base = m[1];
            const number = Number.parseInt(m[2]);
            if (number !== 1) {
                nameValues.push(base + ".1");
            }
        }

        // Look for image in that directory, up up the tree for backs.
        let candidates = [];
        for (const dir of dirValues) {
            // Search for images in the directory.
            for (const name of nameValues) {
                if (side === "face") {
                    candidates.push(path.join(dir, `${name}.face.jpg`));
                    candidates.push(path.join(dir, `${name}.jpg`));
                } else {
                    candidates.push(path.join(dir, `${name}.back.jpg`));
                }
            }

            // Back images may be <cardname>.back.jpg, or <dirname>.back.jpg backwards along the path.
            if (side === "back") {
                for (let up = dir; up != "."; up = path.dirname(up)) {
                    candidates.push(`${up}.back.jpg`);
                }
            }
        }

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }

        // Try some alternates if not found.
        if (!recursed) {
            // If nsid ends with ".omega" also check for _omega named file.
            if (nsid.endsWith(".omega")) {
                const omegaNsid = nsid.replace(/.omega$/, "_omega");
                return AssetFilenames.cardImage(omegaNsid, side, locale, true);
            }
        }

        throw `Missing ${side} for ${nsid}`;
    }

    /**
     * Name the destination deck cardsheet image file.
     *
     * Tabletop Playground decks are able to share cardsheets, naming different
     * cards.  This can save space, but in practice not enough to require it.
     *
     * @param {string} nsid - "type:source/name" encoding
     * @param {string} side - either "face" or "back"
     * @param {string} locale - localization
     * @returns {string} image filename
     */
    static cardsheetImage(nsid, side, sheetIndex, locale) {
        assert(typeof nsid === "string");
        assert(side === "face" || side == "back");
        assert(typeof sheetIndex === "number");
        assert(typeof locale === "string");

        const nsidValues = Nsid.parse(nsid);
        assert(nsidValues);

        return path.join(
            DST_TEXTURES_DIR,
            locale,
            ...nsidValues.type.split("."),
            ...nsidValues.source.split("."),
            `${sheetIndex}.${side}.jpg`
        );
    }

    static sharedBackImage(nsid, locale) {
        assert(typeof nsid === "string");
        assert(typeof locale === "string");

        const nsidValues = Nsid.parse(nsid);
        assert(nsidValues);

        return (
            path.join(DST_TEXTURES_DIR, locale, ...nsidValues.type.split(".")) +
            ".back.jpg"
        );
    }

    /**
     * Name the destination deck template json file.  Templates do not use
     * locale, the packaging pipeline has 'Textures/locale/...' with the
     * literal string "locale" in the path (alongside "global").
     *
     * @param {string} nsid - "type:source/name" encoding
     * @returns {string} template filename
     */
    static templateJson(nsid, sheetIndex) {
        assert(typeof nsid === "string");
        assert(typeof sheetIndex === "number");

        const nsidValues = Nsid.parse(nsid);
        assert(nsidValues);

        return path.join(
            DST_TEMPLATES_DIR,
            ...nsidValues.type.split("."),
            ...nsidValues.source.split("."),
            `${sheetIndex}.json`
        );
    }
}

class CardsheetLayout {
    static getLayout(
        numCards,
        cardW,
        cardH,
        maxDimension = MAX_SHEET_DIMENSION
    ) {
        let best = false;
        for (let pow2W = maxDimension; pow2W >= cardW; pow2W /= 2) {
            for (let pow2H = maxDimension; pow2H >= cardH; pow2H /= 2) {
                // Layout for max size but trim if fewer cards.
                let layout = {
                    numCols: Math.min(Math.floor(pow2W / cardW), numCards),
                };
                layout.numRows = Math.ceil(numCards / layout.numCols);
                layout.sheetW = cardW * layout.numCols;
                layout.sheetH = cardH * layout.numRows;
                layout.pow2W = pow2W;
                layout.pow2H = pow2H;
                layout.footprint = layout.pow2W * layout.pow2H;
                layout.waste = layout.footprint - layout.sheetW * layout.sheetH;
                if (layout.sheetH > pow2H) {
                    continue;
                }
                if (!best || layout.waste < best.waste) {
                    best = layout;
                }
            }
        }
        assert(best);
        return best;
    }

    static groupByType(cardDataArray) {
        const result = {};
        for (const cardData of cardDataArray) {
            const type = cardData.nsidType();
            if (!result[type]) {
                result[type] = [];
            }
            result[type].push(cardData);
        }
        return result;
    }

    static groupBySource(cardDataArray) {
        const result = {};
        for (const cardData of cardDataArray) {
            const source = cardData.nsidSource();
            if (!result[source]) {
                result[source] = [];
            }
            result[source].push(cardData);
        }
        return result;
    }

    static groupByHomebrew(cardDataArray) {
        const result = {};
        for (const cardData of cardDataArray) {
            const homebrew = cardData.nsidSource().startsWith("homebrew")
                ? "homebrew"
                : "ti4";
            if (!result[homebrew]) {
                result[homebrew] = [];
            }
            result[homebrew].push(cardData);
        }
        return result;
    }

    static groupByBackStyle(cardDataArray) {
        const result = {};
        for (const cardData of cardDataArray) {
            const backStyle = cardData.isSharedBack() ? "shared" : "separate";
            if (!result[backStyle]) {
                result[backStyle] = [];
            }
            result[backStyle].push(cardData);
        }
        return result;
    }

    static async groupBySize(cardDataArray) {
        const result = {};
        for (const cardData of cardDataArray) {
            const sizeStr = (await cardData.size()).str;
            assert(typeof sizeStr === "string");
            if (!result[sizeStr]) {
                result[sizeStr] = [];
            }
            result[sizeStr].push(cardData);
        }
        return result;
    }

    static sort(cardDataArray) {
        return cardDataArray.sort((a, b) => {
            // Group by source first.
            if (a.nsidSource() < b.nsidSource()) {
                return -1;
            } else if (a.nsidSource() > b.nsidSource()) {
                return 1;
            }

            // Group leaders by faction first for better sheet locality.
            if (
                a.nsidType().startsWith("card.leader") &&
                b.nsidType().startsWith("card.leader")
            ) {
                const aParts = a.nsidType().split(".");
                const bParts = b.nsidType().split(".");
                aParts.splice(0, 2);
                bParts.splice(0, 2);
                const aType = aParts.shift();
                const bType = bParts.shift();
                const aFaction = aParts.shift();
                const bFaction = bParts.shift();
                const aValue = aFaction + "." + aType;
                const bValue = bFaction + "." + bType;
                if (aValue < bValue) {
                    return -1;
                } else if (aValue > bValue) {
                    return 1;
                }
            }

            if (a.nsidType() < b.nsidType()) {
                return -1;
            } else if (a.nsidType() > b.nsidType()) {
                return 1;
            }
            if (a.nsidName() < b.nsidName()) {
                return -1;
            } else if (a.nsidName() > b.nsidName()) {
                return 1;
            }
            return 0;
        });
    }

    static async splitIntoSheets(cardDataArray) {
        assert(cardDataArray.length > 0);

        // Make sure all cards the same size.
        const size = await cardDataArray[0].size();
        for (const cardData of cardDataArray) {
            assert((await cardData.size()).str == size.str);
        }

        const maxCols = Math.floor(MAX_SHEET_DIMENSION / size.w);
        const maxRows = Math.floor(MAX_SHEET_DIMENSION / size.h);
        const maxCardsPerSheet = maxCols * maxRows;
        const numCardSheets = Math.ceil(
            cardDataArray.length / maxCardsPerSheet
        );

        const result = [];
        for (
            let cardSheetIndex = 0;
            cardSheetIndex < numCardSheets;
            cardSheetIndex++
        ) {
            const start = cardSheetIndex * maxCardsPerSheet;
            const end = Math.min(
                start + maxCardsPerSheet,
                cardDataArray.length
            );
            const cardDataSheet = cardDataArray.slice(start, end);
            for (let i = 0; i < cardDataSheet.length; i++) {
                cardDataSheet[i].extra.cardSheetIndex = cardSheetIndex; // which sheet?
                cardDataSheet[i].extra.cardSheetPosition = i; // where in sheet?
            }
            result.push(cardDataSheet);
        }
        return result;
    }
}

/**
 * Create a cardsheet image for the given cards.
 *
 * @param {Array} cardFilenames - list of card image filename strings
 * @param {string} outputFilename - path/to/sheet.jpg
 * @return {object} sheet metadata {numCols, numRows, width, height, waste}
 */
async function writeCardsheetImage(cardFilenames, outputFilename) {
    assert(cardFilenames.length > 0);
    assert(outputFilename.endsWith(".jpg"));

    const stats = await sharp(cardFilenames[0]).metadata();
    const w = Math.floor(stats.width * CARD_SCALE);
    const h = Math.floor(stats.height * CARD_SCALE);

    const numCards = cardFilenames.length;
    const layout = CardsheetLayout.getLayout(numCards, w, h);
    assert(layout);

    let composite = [];
    for (let i = 0; i < cardFilenames.length; i++) {
        const cardFilename = cardFilenames[i];
        const col = i % layout.numCols;
        const row = Math.floor(i / layout.numCols);

        const left = col * w;
        const top = row * h;

        composite.push({
            input: cardFilename,
            top: top,
            left: left,
        });
    }

    // Composite input can be filename, but if scaling replace with scaled image.
    if (CARD_SCALE !== 1) {
        for (const entry of composite) {
            entry.input = await sharp(entry.input)
                .resize({ width: w, height: h })
                .toBuffer();
        }
    }

    console.log(
        `writeCardsheetImage: deck ${outputFilename} ${layout.sheetW}x${layout.sheetH} px, ${layout.numCols}x${layout.numRows} cards`
    );
    if (TRIAL_RUN) {
        console.log("TRIAL_RUN, aborting before writing file(s)");
        return layout;
    }
    const dir = path.dirname(outputFilename);
    fs.mkdirsSync(dir);
    await sharp({
        create: {
            width: layout.sheetW,
            height: layout.sheetH,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
    })
        .composite(composite)
        .toFile(outputFilename, (err) => {
            console.log(err);
        });

    return layout;
}

async function writeDeckTemplate(
    deckData,
    cardSize,
    cardDataArray,
    layout,
    faceFilename,
    backFilename,
    outputFilename
) {
    assert(typeof deckData.overrideName === "string");
    assert(typeof cardSize.w === "number");
    assert(typeof cardSize.h === "number");
    assert(cardDataArray.length > 0);
    assert(typeof layout.numCols === "number");
    assert(typeof layout.numRows === "number");
    assert(faceFilename.endsWith(".jpg"));
    assert(backFilename.endsWith(".jpg"));
    assert(outputFilename.endsWith(".json"));

    // Verify required-to-match parameters.
    const firstCardData = cardDataArray[0];
    const sizeStr = (await firstCardData.size()).str;
    const sharedBack = firstCardData.isSharedBack();
    const cardSheetIndex = firstCardData.extra.cardSheetIndex;
    for (const cardData of cardDataArray) {
        assert((await cardDataArray[0].size()).str == sizeStr);
        assert(cardData.isSharedBack() === sharedBack);
        assert(cardData.extra.cardSheetIndex === cardSheetIndex);
    }

    const fixTexturePath = function (texturePath) {
        // Strip path to be relative to the assetes/Textures folder.
        assert(texturePath.startsWith(DST_TEXTURES_DIR), texturePath);
        texturePath = texturePath.substring(DST_TEXTURES_DIR.length);

        // Remove any leading slashes (safety).
        while (texturePath.startsWith(path.sep)) {
            texturePath = texturePath.substring(1);
        }

        // First entry is locale, if not 'global' make it 'locale'.
        texturePath = texturePath.split(path.sep);
        if (texturePath[0] !== "global") {
            texturePath[0] = "locale";
        }
        return path.join(...texturePath);
    };
    backFilename = fixTexturePath(backFilename);
    faceFilename = fixTexturePath(faceFilename);

    // 0 : same file (last card?).
    // -1 : same as front.
    // -2 : shared single card, stored in BackTexture.
    // -3 : indexed back sheet, stored in BackTexture.
    const backIndex = sharedBack ? -2 : -3;

    // Per-card lists.
    let cardNames = {}; // NOT A LIST, DICTIONARY!
    let cardMetadata = {}; // NOT A LIST, DICTIONARY!
    const indices = [];
    for (let i = 0; i < cardDataArray.length; i++) {
        const cardData = cardDataArray[i];
        const indexString = `${i}`;
        cardNames[indexString] = cardData.cardNameLocale();
        cardMetadata[indexString] = cardData.nsid();
        const pos = cardData.extra.cardSheetPosition;
        assert(typeof pos === "number");
        indices.push(pos);
    }

    // Set metadata to match deck type + card sheet index.
    const deckNsidType = deckData.cardNsidTypePrefix;
    const deckNsidSource = cardDataArray[0].nsidSource();
    const deckNsid = `${deckNsidType}:${deckNsidSource}/${cardSheetIndex}`;

    // Generate a deterministic guid.
    const forwardSlashPath = outputFilename.split(path.sep).join("/");
    const guid = crypto
        .createHash("sha256")
        .update(forwardSlashPath)
        .digest("hex")
        .substring(0, 32)
        .toUpperCase();

    const json = {
        Type: "Card",
        GUID: guid,
        Name: deckData.overrideName,
        Metadata: deckNsid,
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
        ShouldSnap: true,
        ScriptName: "",
        Blueprint: "",
        Models: [],
        Collision: [],
        Lights: [],
        SnapPointsGlobal: false,
        SnapPoints: [],
        ZoomViewDirection: {
            X: 0,
            Y: 0,
            Z: 0,
        },
        GroundAccessibility: "ZoomAndContext",
        Tags: [],
        FrontTexture: faceFilename,
        BackTexture: backFilename,
        HiddenTexture: "",
        BackIndex: backIndex,
        HiddenIndex: -3, // 0 = use front, -1 = blur, -2 = separate file, -3 = use back
        NumHorizontal: layout.numCols,
        NumVertical: layout.numRows,
        Width: cardSize.w,
        Height: cardSize.h,
        Thickness: 0.05,
        HiddenInHand: true,
        UsedWithCardHolders: true,
        CanStack: true,
        UsePrimaryColorForSide: false,
        FrontTextureOverrideExposed: false,
        AllowFlippedInStack: false,
        MirrorBack: true,
        EmissiveFront: false,
        Model: "Rounded",
        Indices: indices, // card sheet index values
        CardNames: cardNames,
        CardMetadata: cardMetadata,
        CardTags: {},
    };

    console.log(`NSID-CARD: "${deckNsid}": "${guid}",`);

    console.log(
        `writeDeckTemplateJson: ${outputFilename} ${cardDataArray.length} cards`
    );
    if (TRIAL_RUN) {
        console.log("TRIAL_RUN, aborting before writing file(s)");
        return layout;
    }
    const dir = path.dirname(outputFilename);
    fs.mkdirsSync(dir);
    fs.writeFile(outputFilename, JSON.stringify(json, null, "\t"), (err) => {
        if (err) throw err;
    });
}

async function getCardGroups(cardDataArray) {
    const result = [];
    const sourceToCardDataArray = CardsheetLayout.groupBySource(cardDataArray);
    for (const [source, cardDataArray] of Object.entries(
        sourceToCardDataArray
    )) {
        console.log(`processing "${source}", ${cardDataArray.length} cards`);
        if (cardDataArray.length > 0) {
            result.push({
                source,
                cardDataArray: CardsheetLayout.sort(cardDataArray),
            });
        }
    }
    return result;
}

async function organizeDecks(cardNsidTypePrefix, cardGroups, locale) {
    assert(typeof locale === "string");

    const result = [];
    for (const cardGroup of cardGroups) {
        const nsid = `${cardNsidTypePrefix}:${cardGroup.source}/*`;

        // If any face or back isn't global, none are.
        let faceLocale = "global";
        let backLocale = "global";
        let sharedBack = true;
        for (const cardData of cardGroup.cardDataArray) {
            if (!cardData.isFaceGlobal()) {
                faceLocale = locale;
            }
            if (!cardData.isBackGlobal()) {
                backLocale = locale;
            }
            if (!cardData.isSharedBack()) {
                sharedBack = false;
            }
        }

        // Split into cardsheets.
        const cardsheets = await CardsheetLayout.splitIntoSheets(
            cardGroup.cardDataArray
        );
        for (
            let cardSheetIndex = 0;
            cardSheetIndex < cardsheets.length;
            cardSheetIndex++
        ) {
            const faceCardDataArray = cardsheets[cardSheetIndex];
            let backCardDataArray = cardsheets[cardSheetIndex];

            const sheetFace = AssetFilenames.cardsheetImage(
                nsid,
                "face",
                cardSheetIndex,
                faceLocale
            );
            let sheetBack = AssetFilenames.cardsheetImage(
                nsid,
                "back",
                cardSheetIndex,
                backLocale
            );
            const templateJson = AssetFilenames.templateJson(
                nsid,
                cardSheetIndex
            );

            if (sharedBack) {
                backCardDataArray = backCardDataArray.slice(0, 1);
                sheetBack = AssetFilenames.sharedBackImage(nsid, backLocale);
            }

            result.push({
                nsid,
                cardSheetIndex,
                numCardSheets: cardsheets.length,
                faceCardDataArray,
                backCardDataArray,
                sheetFace,
                sheetBack,
                templateJson,
                source: cardGroup.source,
            });
        }
    }
    return result;
}

async function generateDecks(cardNsidTypePrefix, locale) {
    assert(typeof cardNsidTypePrefix === "string");
    assert(typeof locale === "string");

    const deckData = DECKS[cardNsidTypePrefix];
    assert(deckData);
    deckData.cardNsidTypePrefix = cardNsidTypePrefix;

    // Get cards by namespace id to card data.
    const cardIdPattern = "^" + cardNsidTypePrefix + "[.:/]";
    const nsidToCardData = await getMatchingCards(cardIdPattern, locale);
    let cardDataArray = Object.keys(nsidToCardData).map(
        (nsid) => new CardData(nsid, locale)
    );

    const cardGroups = await getCardGroups(cardDataArray);
    const decks = await organizeDecks(cardNsidTypePrefix, cardGroups, locale);

    let footprint = 0;
    let waste = 0;

    for (const deck of decks) {
        const size = await deck.faceCardDataArray[0].size();
        const faceLayout = CardsheetLayout.getLayout(
            deck.faceCardDataArray.length,
            size.w,
            size.h
        );
        const backLayout = CardsheetLayout.getLayout(
            deck.backCardDataArray.length,
            size.w,
            size.h
        );

        footprint += faceLayout.footprint + backLayout.footprint;
        waste += faceLayout.waste + backLayout.waste;

        // Write cardsheets.
        const cardFaces = deck.faceCardDataArray.map((x) => x.face());
        const cardBacks = deck.backCardDataArray.map((x) => x.back());
        await writeCardsheetImage(cardFaces, deck.sheetFace);
        await writeCardsheetImage(cardBacks, deck.sheetBack);

        deckData.overrideName = deckData.name;
        if (deck.numCardSheets == 1) {
            deckData.overrideName += ` (${deck.source})`;
        } else {
            deckData.overrideName += ` (${deck.source} ${
                deck.cardSheetIndex + 1
            }/${deck.numCardSheets})`;
        }
        const cardSize = deckData.size;
        cardDataArray = deck.faceCardDataArray;
        const layout = faceLayout;
        const faceFilename = deck.sheetFace;
        const backFilename = deck.sheetBack;
        const outputFilename = deck.templateJson;
        await writeDeckTemplate(
            deckData,
            cardSize,
            cardDataArray,
            layout,
            faceFilename,
            backFilename,
            outputFilename
        );
    }

    footprint = (footprint * 4) / (1024 * 1024);
    waste = (waste * 4) / (1024 * 1024);
    console.log(`footprint: ${footprint} MB, waste: ${waste} MB`);
    return { footprint, waste };
}

async function buildAllDecks(deckNames) {
    console.log(`Building ${deckNames}`);
    let footprint = 0;
    let waste = 0;
    for (const deckName of deckNames) {
        console.log(`---------- BUILDING ${deckName} ----------`);
        const usage = await generateDecks(deckName, "en");
        footprint += usage.footprint;
        waste += usage.waste;
    }
    console.log(`OVERALL footprint: ${footprint} MB, waste: ${waste} MB`);
}

async function main() {
    let deckNames = process.argv.slice(2);
    if (deckNames.length == 0) {
        console.log("Name the deck or decks to build, or ALL for all");
        return;
    } else if (deckNames[0] == "ALL") {
        deckNames = Object.keys(DECKS);
    }
    buildAllDecks(deckNames.sort());
}

if (require.main === module) {
    main();
}

// Export for unittest.
module.exports = {
    DECKS,
    getMatchingCards,
    CardData,
    AssetFilenames,
    CardsheetLayout,
    organizeDecks,
};
