const fs = require('fs-extra')
const klaw = require('klaw') // walk file system
const path = require('path')
const sharp = require('sharp')
const assert = require('assert')
const { dir } = require('console')

const SRC_DIR = './prebuild/Textures/'
const DST_DIR = '/Users/darrell/t.cardsheets' //'./assets/Textures/'
const DST_TEMPLATE_DIR = '/Users/darrell/t.templates' //'./assets/Templates/'

// TTPG has an 8K limit.  4K is actually a good sweet spot, lower waste vs 8K.
const MAX_SHEET_DIMENSION = 4096

const TRIAL_RUN = false

const DECKS = {
    'card.action' : {
        name : 'Actions',
        sharedBack : true,
    },
    'card.agenda' : {
        name: 'Agenda',
        sharedBack : true,
    },
    'card.alliance' : {
        name: 'Alliance',
        sharedBack : false,
    },
    'card.exploration.cultural' : {
        name: 'Cultural Exploration',
        sharedBack : true,
    },
    'card.exploration.hazardous' : {
        name: 'Hazardous Exploration',
        sharedBack : true,
    },
    'card.exploration.industrial' : {
        name: 'Industrial Exploration',
        sharedBack : true,
    },
    'card.exploration.frontier' : {
        name: 'Frontier Exploration',
        sharedBack : true,
    },
    'card.faction_reference' : {
        name: 'Faction References',
        sharedBack : true,
    },
    'card.faction_token' : {
        name: 'Faction Tokens',
        sharedBack : true,
    },
    'card.leader' : {
        name: 'Leaders',
        sharedBack : false,
    },
    'card.legendary_planet' : {
        name: 'Legendary Planets',
        sharedBack : false,
    },
    'card.planet' : {
        name: 'Planets',
        sharedBack : false,
    },
    'card.promissory' : {
        name: 'Promissory',
        sharedBack : true,
    },
    'card.public_objectives_i' : {
        name: 'Public Objectives I',
        sharedBack : true,
    },
    'card.public_objectives_ii' : {
        name: 'Public Objectives II',
        sharedBack : true,
    },
    'card.relic' : {
        name: 'Relics',
        sharedBack : true,
    },
    'card.secret' : {
        name: 'Secret Objectives',
        sharedBack : true,
    },
    'card.technology.blue' : {
        name: 'Technology (Blue)',
        sharedBack : true,
    },
    'card.technology.green' : {
        name: 'Technology (Green)',
        sharedBack : true,
    },
    'card.technology.yellow' : {
        name: 'Technology (Yellow)',
        sharedBack : true,
    },
    'card.technology.red' : {
        name: 'Technology (Red)',
        sharedBack : true,
    },
    'card.technology.unit_upgrade' : {
        name: 'Technology (Unit Upgrade)',
        sharedBack : true,
    },
    'card.technology.unknown' : {
        name: 'Technology (Unknown)',
        sharedBack : true,
    },
}

/**
 * Find ids matching the pattern, searching the per-card json blobs.
 *
 * @param {string} pattern 
 * @return {Promise} object mapping id string to id json
 */
function getMatchingCardIds(pattern, locale) {
    assert(typeof pattern === 'string')
    assert(typeof locale === 'string')

    return new Promise((resolve, reject) => {
        const re = new RegExp(pattern)    
        let idToJson = {}
        klaw(path.join(SRC_DIR, locale))
            .on('data', item => {
                if (item.path.endsWith('.json')) {
                    const rawdata = fs.readFileSync(item.path)
                    const json = JSON.parse(rawdata)
                    const id = json.id
                    assert(id)
                    if (id.match(re)) {
                        assert(!idToJson[id])
                        idToJson[id] = json
                    }
                }
            })
            .on('error', (err, item) => {
                reject(err)
            })
            .on('end', () => {
                resolve(idToJson)
            })
    })
}

/**
 * Find the card image file inside the prebuild dir.
 * 
 * Card faces are always at the id's path, as either x.face.jpg or x.jpg.
 * Card backs may be dir/x.back.jpg, or dir.back.jpg upward (shared back).
 * 
 * Scan locale first, then try global.
 * 
 * @param {string} id - "path:source/name" encoding
 * @param {string} side - either "face" or "back"
 * @param {string} locale - localization
 * @returns {string} image filename
 */
function getSrcImageFile(id, side, locale) {
    assert(typeof id === 'string')
    assert(side === 'face' || side == 'back')
    assert(typeof locale === 'string')

    let [_, dir, source, name] = id.match(/^(.*):(.*)\/(.*)$/)

    dir = dir.split('.')
    assert(dir[0] == 'card')
    dir = path.join(SRC_DIR, locale, ...dir)

    candidates = []
    if (side === 'face') {
        candidates.push(path.join(dir, `${name}.face.jpg`))
        candidates.push(path.join(dir, `${name}.jpg`))
    } else {
        candidates.push(path.join(dir, `${name}.back.jpg`))
        for (let up = dir; up != '.'; up = path.dirname(up)) {
            candidates.push(`${up}.back.jpg`)
        }
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }

    // Numbered names may be copies of the .1 card.
    let m = id.match(/^(.*)\.([0-9]+)$/)
    if (m) {
        let [_2, baseId, number] = m
        if (number != '1') {
            return getSrcImageFile(baseId + '.1', side, locale)
        }
    }

    // If locale is not global, try that.
    if (locale != 'global') {
        return getSrcImageFile(id, side, 'global')
    }

    throw `Missing ${side} for ${id}`
}

/**
 * Name the destination deck cardsheet image file.
 * 
 * @param {string} idPrefix - id path prefix naming just the deck, no source/name portion
 * @param {string} source - source portion of the id string
 * @param {string} side - either "face" or "back"
 * @param {string} locale - localization
 * @returns {string} image filename
 */
function getDstImageFile(idPrefix, source, side, sheetIndex, locale) {
    assert(typeof idPrefix === 'string')
    assert(typeof source === 'string')
    assert(side === 'face' || side == 'back')
    assert(typeof sheetIndex === 'number')
    assert(typeof locale === 'string')

    assert(!idPrefix.includes(':'))
    assert(!idPrefix.includes('/'))

    let dir = idPrefix.split('.')
    assert(dir[0] == 'card')
    dir = path.join(DST_DIR, locale, ...dir) // deck named for dir position in id path

    let result = dir
    if (source.length > 0) {
        result += '.' + source
    }
    result += '.' + side
    if (sheetIndex >= 0) {
        result += `.${sheetIndex}`
    }
    return result += '.jpg'
}

/**
 * Name the destination deck template json file.
 * 
 * @param {string} idPrefix - id path prefix naming just the deck, no source/name portion
 * @param {string} source - source portion of the id string
 * @returns {string} template filename
 */
 function getDstJsonFile(idPrefix, source, sheetIndex) {
    assert(typeof idPrefix === 'string')
    assert(typeof source === 'string')
    assert(typeof sheetIndex === 'number')

    assert(!idPrefix.includes(':'))
    assert(!idPrefix.includes('/'))

    let dir = idPrefix.split('.')
    assert(dir[0] == 'card')
    dir = path.join(DST_TEMPLATE_DIR, locale, ...dir)

    return `${dir}.${source}.${sheetIndex}.json`
}

/**
 * Create a cardsheet image for the given cards.
 * 
 * @param {Array} cardFilenames - list of card image filename strings
 * @param {string} outputFilename - path/to/sheet.jpg
 * @return {object} sheet metadata {numCols, numRows, width, height, waste}
 */
async function writeCardsheetImage(cardFilenames, outputFilename) {
    assert(cardFilenames.length > 0)

    const stats = await sharp(cardFilenames[0]).metadata()
    const w = stats.width
    const h = stats.height

    const numCards = cardFilenames.length
    const getLayout = function(maxW, maxH) {
        // Layout for max size but trim if fewer cards.  
        let layout = {
            numCols : Math.min(Math.floor(maxW / w), numCards),
        }
        layout.numRows = Math.ceil(numCards / layout.numCols)
        layout.sheetW = w * layout.numCols
        layout.sheetH = h * layout.numRows
        layout.pow2W = Math.pow(2, Math.ceil(Math.log(layout.sheetW) / Math.log(2)))
        layout.pow2H = Math.pow(2, Math.ceil(Math.log(layout.sheetH) / Math.log(2)))
        layout.footprint = layout.pow2W * layout.pow2H
        layout.waste = layout.footprint - (layout.sheetW * layout.sheetH)
        if (layout.sheetH <= maxH) {
            return layout
        }
    }

    // Find a good layout option.
    let layout = getLayout(MAX_SHEET_DIMENSION, MAX_SHEET_DIMENSION)
    if (!layout) {
        throw `sheet larger than MAX_SHEET_DIMENSION`
    }
    for (let maxW = MAX_SHEET_DIMENSION; maxW >= 1024; maxW /= 2) {
        for (let maxH = MAX_SHEET_DIMENSION; maxH >= 1024; maxH /= 2) {
            const candidate = getLayout(maxW, maxH)
            if (candidate && candidate.waste < layout.waste) {
                layout = candidate
            }
        }
    }
    
    let composite = []
    for (let i = 0; i < cardFilenames.length; i++) {
        const cardFilename = cardFilenames[i]
        const col = i % layout.numCols
        const row = Math.floor(i / layout.numCols)

        const left = col * w
        const top = row * h

        composite.push({
            input : cardFilename,
            top : top,
            left : left,
        })
    }

    console.log(`buildSheet: deck ${outputFilename} ${layout.sheetW}x${layout.sheetH} px, ${layout.numCols}x${layout.numRows} cards`)
    if (TRIAL_RUN) {
        console.log('TRIAL_RUN, aborting before writing file(s)')
        return layout
    }

    const dir = path.dirname(outputFilename)
    fs.mkdirsSync(dir)

    await sharp({
        create: {
            width : layout.sheetW,
            height : layout.sheetH,
            channels : 4,
            background : { r:0, g:0, b:0, alpha:1 }
        }
    })
    .composite(composite)
    .toFile(outputFilename, err => { console.log(err) })

    return layout
}

async function writeDeckTemplateJson(cardJsonArray, outputFilename) {
    // XXX TODO
}

async function generateDeck(deckId, locale) {
    assert(typeof deckId === 'string')
    assert(typeof locale === 'string')

    const deckData = DECKS[deckId]
    assert(deckData, `unknown deckId "${deckId}"`)

    // Get cards by namespace id to card data.
    const cardIdPattern = '^' + deckId + '[\.:/]'
    const idToCardData = await getMatchingCardIds(cardIdPattern, locale)

    // Fill in more data.
    let firstCardSize = false
    let sourceToIds = {}
    for (const id in idToCardData) {
        let cardData = idToCardData[id]
       
        cardData.face = getSrcImageFile(id, 'face', locale)
        cardData.back = getSrcImageFile(id, 'back', locale)

        const faceStats = await sharp(cardData.face).metadata()
        const backStats = await sharp(cardData.face).metadata()
        if (!firstCardSize) {
            firstCardSize = faceStats
        }
        assert(faceStats.width == firstCardSize.width)
        assert(faceStats.height == firstCardSize.height)
        assert(backStats.width == firstCardSize.width)
        assert(backStats.height == firstCardSize.height)

        // Also split into per-source lists.
        let [_, dir, source, name] = id.match(/^(.*):(.*)\/(.*)$/)
        if (!sourceToIds[source]) {
            sourceToIds[source] = []
        }
        sourceToIds[source].push(id)
    }

    // Verify shared back when set.  If this fails there is an errant back.jpg.
    if (deckData.sharedBack) {
        let firstBack = false
        for (const cardData of Object.values(idToCardData)) {
            if (!firstBack) {
                firstBack = cardData.back
            }
            assert(cardData.back == firstBack, cardData.back + ' vs ' + firstBack)
        }
    }
    
    // If all back images come from global, store the package image in global.
    let backLocale = 'global'
    for (const cardData of Object.values(idToCardData)) {
        if (!cardData.back.includes('/Textures/global/')) {
            backLocale = locale
            break
        }
    }
    
    // Break up into sheets.
    let footprint = 0
    let waste = 0
    const maxColsPerSheet = Math.floor(MAX_SHEET_DIMENSION / firstCardSize.width)
    const maxRowsPerSheet = Math.floor(MAX_SHEET_DIMENSION / firstCardSize.height)
    const maxCardsPerSheet = maxColsPerSheet * maxRowsPerSheet
    for (const source in sourceToIds) {
        const ids = sourceToIds[source]
        ids.sort((a, b) => {
            let [_1, dir1, source1, name1] = a.match(/^(.*):(.*)\/(.*)$/)
            let [_2, dir2, source2, name2] = b.match(/^(.*):(.*)\/(.*)$/)
            return name1 < name2 ? -1 : 1
        })
        for (let start = 0; start < ids.length; start += maxCardsPerSheet) {
            let end = Math.min(start + maxCardsPerSheet, ids.length)
            const sheetIds = ids.slice(start, end)
            const sheetIndex = Math.floor(start / maxCardsPerSheet)

            console.log(`${deckId}, ${source}, ${start}:${end}/${ids.length}`)
            //console.log(sheetIds)

            // Face.
            const faceImgFile = getDstImageFile(deckId, source, 'face', sheetIndex, locale)
            let cardFilenames = []
            for (const id of sheetIds) {
                cardFilenames.push(idToCardData[id].face)
            }
            const faceLayout = await writeCardsheetImage(cardFilenames, faceImgFile)
            footprint += faceLayout.footprint
            waste += faceLayout.waste

            // Back.
            let backSheetIndex = sheetIndex
            let backSource = source
            cardFilenames = []
            for (const id of sheetIds) {
                cardFilenames.push(idToCardData[id].back)
            }
            if (deckData.sharedBack) {
                backSource = ''
                backSheetIndex = -1
                cardFilenames = cardFilenames.slice(0, 1)
            }
            const backImgFile = getDstImageFile(deckId, backSource, 'back', backSheetIndex, locale)
            const backLayout = await writeCardsheetImage(cardFilenames, backImgFile)
            footprint += backLayout.footprint
            waste += backLayout.waste
        }
    }
    return { footprint, waste }
}

async function buildAllDecks(deckNames) {
    console.log(`Building ${deckNames}`)
    let footprint = 0
    let waste = 0
    for (const deckName of deckNames) {
        console.log(`---------- BUILDING ${deckName} ----------`)
        const usage = await generateDeck(deckName, 'en')
        footprint += usage.footprint
        waste += usage.waste
    }
    const scale = 4 / 1024 / 1024 / 1024
    console.log({ footprint : footprint * scale, waste : waste * scale, done:'DONE' })
}

// Build decks.
let deckNames = process.argv.slice(2)
if (deckNames.length == 0) {
    console.log('Name the deck or decks to build, or ALL for all')
    return
} else if (deckNames[0] == 'ALL') {
    deckNames = Object.keys(DECKS)
}
buildAllDecks(deckNames.sort())
