/**
 * Press the R key on a relevant object (potentially with other selected 
 * objects) to swap, split, or combine.
 */
const { globalEvents, world } = require('../wrapper/api')
const { Facing } = require('../lib/facing')
const { PlayerColor } = require('../lib/player-color')
const assert = require('../wrapper/assert')

console.log('---RELOAD---')

const METADATA_TO_INFO = {
    'unit:base/fighter' : { 
        name : 'fighter $COLOR',
        bag : 'bag.unit:base/fighter'
    },
    'token:base/fighter_1' : { name : 'fighter_x1' },
    'token:base/fighter_3' : { name : 'fighter_x3' },
    'unit:base/infantry' : { name : 'infantry $COLOR' },
    'token:base/infantry_1' : { name : 'infantry_x1' },
    'token:base/infantry_3' : { name : 'infantry_x3' },
    'token:base/tradegood_commodity_1' : { name : 'tg_x1' },
    'token:base/tradegood_commodity_3' : { name : 'tg_x3' },
}

const REPLACE_RULES = [
    {
        repeatable : true,
        consume : { count : 3, names : [ 'fighter_x1', 'fighter $COLOR' ] },
        produce : { count : 1, name : 'fighter_x3' }
    },
    {
        consume : { count : 1, name : 'fighter_x3' },
        produce : { count : 3, name : 'fighter_x1' }
    },
    {
        consume : { count : 1, name : 'fighter_x1' },
        produce : { count : 1, name : 'fighter $COLOR' }
    },
    {
        consume : { count : 1, name :  'fighter $COLOR' },
        produce : { count : 1, name : 'fighter_x1' }
    },

    // Preserve face up/down
    {
        repeatable : true,
        faceUp : true,
        consume : { count : 3, name : 'tg_x1' },
        produce : { count : 1, name : 'tg_x3' }
    },
    {
        faceDown : true,
        consume : { count : 1, name : 'tg_x3' },
        produce : { count : 3, name : 'tg_x1' }
    },    
]

function getBag(id, playerColor) {
    assert(typeof id === 'string')
    assert((!playerColor) || (typeof playerColor === 'string'))

    for (const obj of world.getAllObjects()) {
        if (!obj.getItems) {
            continue  // not a bag
        }
        // TODO XXX THIS SHOULD FIND AN EMPTY UNIT BAG
        const firstItem = obj.getItems()[0]
        if (!firstItem) {
            continue  // empty bag
        }
        const bagItemId = firstItem.getTemplateMetadata()
        if (playerColor) {
            const bagItemColor = PlayerColor.fromObject(firstItem)
            if (bagItemColor !== playerColor) {
                continue  // color mismatch
            }
        }
        if (id === bagItemId) {
            return obj
        }
    }
    throw new Error(`getBag(${id}, ${playerColor}) failed`)
}

function consume(obj, playerColor) {
    assert(typeof playerColor === 'string')
    console.log('consume ' + obj.getTemplateMetadata())

    const id = obj.getTemplateMetadata()
    const objInfo = METADATA_TO_INFO[id]
    if (!objInfo.name.includes('$COLOR')) {
        playerColor = false  // not needed
    }
    const bag = getBag(id, playerColor)
    assert(bag)
    bag.addObjects([ obj ], 0, true)
}

function produce(id, playerColor, position, faceDown) {
    assert(typeof id === 'string')
    assert(typeof playerColor === 'string')
    console.log('produce ' + id)

    const objInfo = METADATA_TO_INFO[id]
    if (!objInfo.name.includes('$COLOR')) {
        playerColor = false  // not needed
    }
    const bag = getBag(id, playerColor)
    const obj = bag.takeAt(0, position, true)
    if (faceDown) {
        // XXX TODO
    }
}

/**
 * Does this object match rule.consume?
 * 
 * @param {GameObject} obj 
 * @param {object} rule 
 * @returns {boolean}
 */
function isConsumable(obj, rule) {
    const objInfo = METADATA_TO_INFO[obj.getTemplateMetadata()]
    if (!objInfo) {
        return false
    } else if (rule.consume.name && rule.consume.name !== objInfo.name) {
        return false
    } else if (rule.consume.names && !rule.consume.names.includes(objInfo.name)) {
        return false
    } else if (rule.faceUp && Facing.isFaceDown(obj)) {
        return false
    } else if (rule.faceDown && Facing.isFaceUp(obj)) {
        return false
    }
    return true
}

/**
 * Does this object match rules with "$COLOR" restrictions?
 * 
 * @param {GameObject} obj
 * @param {string} playerColor
 * @returns {boolean}
 */
function isColor(obj, playerColor) {
    const objInfo = METADATA_TO_INFO[obj.getTemplateMetadata()]
    if (!objInfo) {
        return false  // only consider registered objects
    }
    if (!objInfo.name.includes('$COLOR')) {
        return true // no color restrictions
    }
    const objectColor = PlayerColor.fromObject(obj)
    return objectColor === playerColor
}

function applyRule(objs, rule) {
    // Gather consumable items, fail if not enough.
    const consumable = objs.filter(obj => isConsumable(obj, rule))
    if (consumable.length < rule.consume.count) {
        return false
    }

    // Find the metadata value for the produce name.
    const nameToId = name => {
        for (const [id, entry] of Object.entries(METADATA_TO_INFO)) {
            if (entry.name === name) {
                return id
            }
        }
        throw new Error(`unknown name ${name}`)
    }

    const applyCount = rule.repeat ? Math.floor(consumable.length / rule.consume.count) : 1
    return {
        consume : consumable.slice(0, rule.consume.count * applyCount),
        produce : {
            id : nameToId(rule.produce.name),
            count : rule.produce.count * applyCount
        }
    }
}

const _ignoreSet = new Set()

function onR(obj, player) {
    if (obj.getTemplateMetadata() == 'unit:base/fighter') {
        console.log('XXX SETTING COLOR')
        PlayerColor.setObjectColor(obj, 'white')
    }

    // Careful, if multiple objects selected ALL get a separate call!
    const guid = obj.getId()
    if (_ignoreSet.has(guid)) {
        _ignoreSet.delete(guid)
        return
    }
    for (const selectedObj of player.getSelectedObjects()) {
        const selectedObjGuid = selectedObj.getId()
        if (selectedObjGuid != guid) {
            _ignoreSet.add(selectedObjGuid)
        }
    }

    console.log('R ' + obj.getTemplateMetadata())
    const playerColor = PlayerColor.fromColor(player.getPlayerColor())

    // If the object receiving the "R" is in the selected set process the set,
    // otherwise just the object.
    let objs = [ obj ]
    const selectedObjs = player.getSelectedObjects()
    for (const selectedObj of selectedObjs) {
        if (selectedObj == obj) {
            objs = selectedObjs
            break
        }
    }

    // Discard any objects not matching player color (tokens always match).
    objs = objs.filter(obj => isColor(obj, playerColor))

    // Always prefer swapping tokens to units (need one plastic!).  Move them
    // to the front of the list.
    objs = objs.sort((a, b) => {
        const aId = a.getTemplateMetadata()
        const bId = b.getTemplateMetadata()
        if (aId.startsWith('token')) {
            return -1
        }
        if (bId.startsWith('token')) {
            return 1
        }
        return 0
    })

    // Find the first matching rule.
    let match
    for (const rule of REPLACE_RULES) {
        match = applyRule(objs, rule)
        if (match) {
            break
        }
    }
    if (!match) {
        return
    }

    console.log(match.consume)
    for (const obj of match.consume) {
        consume(obj, playerColor)
    }
    for (let i = 0; i < match.produce.count; i++) {
        const pos = player.getCursorPosition().add(new Vector(0, i * 2, 5 + i * 3))
        produce(match.produce.id, playerColor, pos)
    }
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (METADATA_TO_INFO[obj.getTemplateMetadata()]) {
        obj.onPrimaryAction.add(onR)
    }
})

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === 'ScriptReload') {
    for (const obj of world.getAllObjects()) {
        if (METADATA_TO_INFO[obj.getTemplateMetadata()]) {
            obj.onPrimaryAction.add(onR)
        }
    }
}

// Export for the unittest.
module.exports = {
    isConsumable,
    isColor,
    applyRule,
    onR,
}