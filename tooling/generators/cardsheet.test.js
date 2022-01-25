const assert = require('assert')
require('regenerator-runtime') // for async tests

const {
    getMatchingCards,
    CardData,
    AssetFilenames,
    CardsheetLayout,
} = require('./cardsheets')

it('get matching cards for each deck', async () => {
    const nsidToJson = await getMatchingCards('card.action:base/.*', 'en')
    const nsids = Object.keys(nsidToJson)
    assert.equal(nsids.length, 80)

    // Here's how to extract the strings if/when moving to a localization framework.
    // let cards_en = {}
    // for (const [nsid, json] of Object.entries(nsidToJson)) {
    //     cards_en[nsid + '+name'] = json.name
    //     if (json.desc.length > 0) {
    //         cards_en[nsid + '+desc'] = json.desc
    //     }
    // }
    // console.log(cards_en)
})

// ----------------------------------------------------------------------------

it('CardData en face with shared back', async () => {
    const nsid = 'card.action:base/ghost_ship'
    const locale = 'en'
    const cardData = new CardData(nsid, locale)
    assert.equal(cardData.nsid(), 'card.action:base/ghost_ship')
    assert.equal(cardData.nsidType(), 'card.action')
    assert.equal(cardData.nsidSource(), 'base')
    assert.equal(cardData.nsidName(), 'ghost_ship')
    assert.equal(cardData.locale(), 'en')
    assert.equal(cardData.cardNameLocale(), 'Ghost Ship')

    assert.equal(cardData.face(), 'prebuild/Textures/en/card/action/ghost_ship.jpg')
    assert(!cardData.isFaceGlobal())
    assert.equal(cardData.back(), 'prebuild/Textures/global/card/action.back.jpg')
    assert(cardData.isBackGlobal())
    assert(cardData.isSharedBack())

    const size = await cardData.size()
    assert.equal(size.w, 500)
    assert.equal(size.h, 750)
    assert.equal(size.str, '500x750')
})

// ----------------------------------------------------------------------------

it('AssetFilenames.cardImage en face with shared back', () => {
    const nsid = 'card.action:base/ghost_ship'
    const face = AssetFilenames.cardImage(nsid, 'face', 'en')
    assert.equal(face, 'prebuild/Textures/en/card/action/ghost_ship.jpg')
})

it('AssetFilenames.cardImage en face with custom back', () => {
    const nsid = 'card.planet:base/lodor'
    const face = AssetFilenames.cardImage(nsid, 'face', 'en')
    const back = AssetFilenames.cardImage(nsid, 'back', 'en')
    assert.equal(face, 'prebuild/Textures/en/card/planet/lodor.face.jpg')
    assert.equal(back, 'prebuild/Textures/en/card/planet/lodor.back.jpg')
})

it('AssetFilenames.cardImage global back', () => {
    const nsid = 'card.action:base/ghost_ship'
    const back = AssetFilenames.cardImage(nsid, 'back', 'en')
    assert.equal(back, 'prebuild/Textures/global/card/action.back.jpg')
})

it('AssetFilenames.cardImage global back (2)', () => {
    const nsid = 'card.action:codex.ordinian/blitz'
    const back = AssetFilenames.cardImage(nsid, 'back', 'en')
    assert.equal(back, 'prebuild/Textures/global/card/action.back.jpg')
})

it('AssetFilenames.cardImage redirect duplicate', () => {
    const nsid = 'card.exploration.cultural:pok/cultural_relic_fragment.2'
    const face = AssetFilenames.cardImage(nsid, 'face', 'en')
    assert.equal(face, 'prebuild/Textures/en/card/exploration/cultural/cultural_relic_fragment.1.jpg')
})

it('AssetFilenames.cardsheetImage en face', () => {
    const nsid = 'card.action:base/*'
    const face = AssetFilenames.cardsheetImage(nsid, 'face', 0, 'en')
    assert.equal(face, 'assets/Textures/en/card/action/base/0.face.jpg')
})

it('AssetFilenames.cardsheetImage shared back', () => {
    const nsid = 'card.action:base/*'
    const face = AssetFilenames.sharedBackImage(nsid, 'en')
    assert.equal(face, 'assets/Textures/en/card/action.back.jpg')
})

it('AssetFilenames.templateJson', () => {
    const nsid = 'card.action:base/*'
    const json = AssetFilenames.templateJson(nsid, 0)
    assert.equal(json, 'assets/Templates/card/action/base/0.json')
})

// ----------------------------------------------------------------------------

it('CardsheetLayout.getLayout 8x2', () => {
    const numCards = 16
    const cardW = 500
    const cardH = 750
    const layout = CardsheetLayout.getLayout(numCards, cardW, cardH)
    assert.equal(layout.numCols, 8)
    assert.equal(layout.numRows, 2)
    assert.equal(layout.footprint, 4096 * 2048)
    assert.equal(layout.waste, 4096 * 2048 - 4000 * 1500)
})

it('CardsheetLayout.getLayout 4x5', () => {
    const numCards = 17 // with 17, more efficient with fewer columns
    const cardW = 500
    const cardH = 750
    const layout = CardsheetLayout.getLayout(numCards, cardW, cardH)
    assert.equal(layout.numCols, 4)
    assert.equal(layout.numRows, 5)
})

it('CardsheetLayout.groupBySource', () => {
    const base = 'card.action:base/ghost_ship'
    const pok = 'card.action:pok/rout'
    const cardDataArray = [
        new CardData(base, 'en'),
        new CardData(pok, 'en'),
    ]
    const sourceToCardDataArrays = CardsheetLayout.groupBySource(cardDataArray)
    assert.equal(sourceToCardDataArrays['base'].length, 1)
    assert.equal(sourceToCardDataArrays['base'][0].nsid(), base)
    assert.equal(sourceToCardDataArrays['pok'].length, 1)
    assert.equal(sourceToCardDataArrays['pok'][0].nsid(), pok)
})

it('CardsheetLayout.groupByBackStyle', () => {
    const shared = 'card.action:base/ghost_ship'
    const separate = 'card.planet:base/lodor'
    const cardDataArray = [
        new CardData(shared, 'en'),
        new CardData(separate, 'en'),
    ]
    const sizeStrToCardDataArrays = CardsheetLayout.groupByBackStyle(cardDataArray)
    assert.equal(sizeStrToCardDataArrays['shared'].length, 1)
    assert.equal(sizeStrToCardDataArrays['shared'][0].nsid(), shared)
    assert.equal(sizeStrToCardDataArrays['separate'].length, 1)
    assert.equal(sizeStrToCardDataArrays['separate'][0].nsid(), separate)
})

it('CardsheetLayout.groupBySize', async () => {
    const tall = 'card.action:base/ghost_ship'
    const wide = 'card.technology.blue:base/gravity_drive'
    const cardDataArray = [
        new CardData(tall, 'en'),
        new CardData(wide, 'en'),
    ]
    const sizeStrToCardDataArrays = await CardsheetLayout.groupBySize(cardDataArray)
    assert.equal(sizeStrToCardDataArrays['500x750'].length, 1)
    assert.equal(sizeStrToCardDataArrays['500x750'][0].nsid(), tall)
    assert.equal(sizeStrToCardDataArrays['750x500'].length, 1)
    assert.equal(sizeStrToCardDataArrays['750x500'][0].nsid(), wide)
})

it('CardsheetLayout.sort', () => {
    const cardDataArray = [
        new CardData('card.action:base/ghost_ship', 'en'),
        new CardData('card.action:base/parley', 'en'),
        new CardData('card.action:pok/rout', 'en'),
        new CardData('card.planet:base/lodor', 'en'),
        new CardData('card.planet:base/abyz', 'en'),
        new CardData('card.planet:base/fria', 'en'),
        new CardData('card.planet:pok/mirage', 'en'),
        new CardData('card.planet:base/winnu', 'en'),
        new CardData('card.action:pok/waylay', 'en'),
    ]
    let result = CardsheetLayout.sort(cardDataArray)
    result = result.map(x => x.nsid())
    assert.deepEqual(result, [
        'card.action:base/ghost_ship',
        'card.action:base/parley',
        'card.planet:base/abyz',
        'card.planet:base/fria',
        'card.planet:base/lodor',
        'card.planet:base/winnu',
        'card.action:pok/rout',
        'card.action:pok/waylay',
        'card.planet:pok/mirage'
    ])
})

it ('CardsheetLayout.splitIntoSheets', async () => {
    const cardDataArray = []
    while (cardDataArray.length < 41) {
        const cardData = new CardData('card.action:base/ghost_ship', 'en')
        cardDataArray.push(cardData)
    }
    const cardDataSheets = await CardsheetLayout.splitIntoSheets(cardDataArray)
    assert.equal(cardDataSheets.length, 2)
    assert.equal(cardDataSheets[0].length, 40)
    assert.equal(cardDataSheets[1].length, 1)

    assert.equal(cardDataSheets[0][0].extra.cardSheetIndex, 0)
    assert.equal(cardDataSheets[0][0].extra.cardSheetPosition, 0)

    assert.equal(cardDataSheets[1][0].extra.cardSheetIndex, 1)
    assert.equal(cardDataSheets[1][0].extra.cardSheetPosition, 0)
})

