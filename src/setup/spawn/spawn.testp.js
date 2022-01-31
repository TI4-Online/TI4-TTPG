const { Spawn } = require('./spawn')
const {
    Card,
    Rotator,
    Vector,
    refObject,
    world,
} = require('../../wrapper/api')
const { ObjectNamespace } = require('../../lib/object-namespace')

const ACTION = {
    SPAWN_ALL : '*Spawn ALL',
    SPAWN_TYPES : '*Spawn TYPES',
    CLEAN_ALL : '*Clean ALL',
}

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action)
}

function asyncSpawnAll(player) {
    let nsids = Spawn.getAllNSIDs()
    nsids = nsids.filter(nsid => !nsid.includes('homebrew'))

    const randomPos = () => {
        const x = 80 * (Math.random() - 0.5)
        const y = 220 * (Math.random() - 0.5)
        const z = world.getTableHeight() + 10 + 10 * Math.random()
        return new Vector(x, y, z)
    }

    const randomRot = (isCard) => {
        const pitch = 0
        const yaw = 360 * Math.random()
        const roll = isCard ? 180 : 0
        return new Rotator(pitch, yaw, roll)
    }

    const processNext = () => {
        if (nsids.length == 0) {
            console.log(`#objects = ${world.getAllObjects().length}`)
            return
        }
        const nsid = nsids.pop()
        Spawn.spawn(nsid, randomPos(), randomRot())

        setTimeout(processNext, 100)
    }
    processNext()
}

function asyncSpawnTypes() {
    let nsids = Spawn.getAllNSIDs()
    nsids = nsids.filter(nsid => !ObjectNamespace.parseNsid(nsid).source.includes('homebrew'))
    const typeToNsids = Spawn.groupNSIDs(nsids)

    const x0 = 30
    const y0 = -100
    const z0 = world.getTableHeight() + 2
    const yMax = 100
    const dx = -15
    const dy = 15
    const pos = new Vector(x0, y0, z0)
    const rot = new Rotator(0, 0, 0)

    const nsidGroups = Object.values(typeToNsids)
    const processNext = () => {
        if (nsidGroups.length == 0) {
            console.log(`#objects = ${world.getAllObjects().length}`)
            return
        }
        const nsids = nsidGroups.pop()

        pos.z = z0
        let lastObj = false
        for (const nsid of nsids) {
            const obj = Spawn.spawn(nsid, pos, rot)

            // Try to name object.
            const name = Spawn.suggestName(nsid)
            if (name) {
                obj.setName(name)
            } else {
                console.warn(`anonymous ${nsid}`)
            }

            pos.z += (obj.getExtent().z * 2) + 10
            
            if ((obj instanceof Card) && (lastObj instanceof Card)) {
                lastObj.addCards(obj)
            } else {
                lastObj = obj
            }
        }

        pos.y += dy
        if (pos.y > yMax) {
            pos.y = y0
            pos.x += dx
        }
        setTimeout(processNext, 100)
    }
    processNext()
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`)

    if (actionName === ACTION.SPAWN_ALL) {
        asyncSpawnAll(player)
    }

    else if (actionName === ACTION.SPAWN_TYPES) {
        asyncSpawnTypes(player)
    }

    else if (actionName === ACTION.CLEAN_ALL) {
        for (const obj of world.getAllObjects()) {
            if (obj != refObject) {
                obj.destroy()
            }
        }
    }

})