/**
 * Press the R key on a relevant object (potentially with other selected 
 * objects) to swap, split, or combine.
 */
const { globalEvents, world } = require('../wrapper/api')
const { Facing } = require('../lib/facing')

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
        produce : { count : 1, name : 'fighter' }
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
        consume : consumable.splice(0, applyCount),
        produce : {
            id : nameToId(rule.produce.name),
            count : rule.produce.count * applyCount
        }
    }
}

function onR(obj, player) {
    console.log('R ' + obj.getTemplateMetadata())

    // If the object receiving the "R" is in the selected set process the set,
    // otherwise just the object.
    let processObjects = [ obj ]
    const selectedObects = player.getSelectedObjects()
    for (const selectedObject of selectedObects) {
        if (selected == obj) {
            processObjects = selectedObects
            break
        }
    }

    // Always prefer swapping tokens to units (need one plastic!).  Move them
    // to the front of the list.
    processObjects = processObjects.sort((a, b) => {
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
    let rule = false
    for (const candidateRule of REPLACE_RULES) {
        let consume = []
        for (const candidateObject of processObjects) {
            const name = METADATA_TO_INFO[candidateObject.getTemplateMetadata()].name
            if (name == candidateRule.consume.item || name in candidateRule.consume.items) {
                consume.push(candidateObject)
            }
        }
        if (consume.length > CandidateRule.consume.count) {
            rule = candidateRule
            break
        }
    }
    if (!rule) {
        return  // no matching rule
    }

    do {
        // Fail if produce bag does not have inventory.
        // TODO
    } while (rule.repeatable)


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
    applyRule,
}