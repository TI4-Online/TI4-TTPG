// the "it(string, function)" style works with mocha and jest frameworks
const assert = require("assert")
const { HexLib } = require('./HexLib')

it('cannot construct', () => {
    assert.throws(() => { new HexLib() })
})
  
it('fromPosition', () => {    
    let pos = { x : 0, y : 0, z : 0 }
    let hex = HexLib.fromPosition(pos)
    assert.equal(hex, '<0,0,0>')

    // Z does not matter.
    pos.z = 10
    hex = HexLib.fromPosition(pos)
    assert.equal(hex, '<0,0,0>')

    // +X, two rings east.
    pos.x = HexLib.HALF_SIZE * 3
    pos.y = 0
    hex = HexLib.fromPosition(pos)
    assert.equal(hex, '<2,-1,-1>')

    // +Y, one ring north.
    pos.x = 0
    pos.y = HexLib.HALF_SIZE * Math.sqrt(3)
    hex = HexLib.fromPosition(pos)
    assert.equal(hex, '<0,1,-1>')
})

it('toPosition', () => {
    let hex = '<0,0,0>'
    let pos = HexLib.toPosition(hex)
    assert.equal(pos.x, 0)
    assert.equal(pos.y, 0)
    assert.equal(pos.z, 0)

    // +X, two rings east.
    hex = '<2,-1,-1>'
    pos = HexLib.toPosition(hex)
    assert(Math.abs(pos.x - HexLib.HALF_SIZE * 3) < 0.01)
    assert(Math.abs(pos.y) < 0.01)
    assert.equal(pos.z, 0)

    // +Y, one ring north.
    hex = '<0,1,-1>'
    pos = HexLib.toPosition(hex)
    assert.equal(pos.x, 0)
    assert(Math.abs(pos.y - HexLib.HALF_SIZE * Math.sqrt(3)) < 0.01)
    assert.equal(pos.z, 0)
})

it('corners', () => {
    let hex = '<0,0,0>'
    let corners = HexLib.corners(hex)
    assert.equal(corners.length, 6)

    assert(Math.abs(corners[0].x - HexLib.HALF_SIZE) < 0.01)
    assert(Math.abs(corners[0].y - 0) < 0.01)

    assert(Math.abs(corners[1].x - HexLib.HALF_SIZE / 2) < 0.01)
    assert(Math.abs(corners[1].y - HexLib.HALF_SIZE * Math.sqrt(3) / 2) < 0.01)

    assert(Math.abs(corners[2].x + HexLib.HALF_SIZE / 2) < 0.01)

    assert(Math.abs(corners[3].x + HexLib.HALF_SIZE) < 0.01)
    assert(Math.abs(corners[3].y - 0) < 0.01)
})

it('neighbors', () => {
    let hex = '<0,0,0>'
    let neighbors = HexLib.neighbors(hex)
    assert.equal(neighbors.length, 6)
    assert.deepEqual(neighbors, [
        '<1,0,-1>',
        '<1,-1,0>',
        '<0,-1,1>',
        '<-1,0,1>',
        '<-1,1,0>',
        '<0,1,-1>' // north
      ])
})