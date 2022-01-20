const { Polygon } = require('./Polygon')
const { Vector } = require('../wrapper/api')
const assert = require('assert')

it('constructor', () => {
    new Polygon([])
})

it('add', () => {
    let p = new Polygon([
        new Vector(1,2,3),
        new Vector(4,5,6)
    ])
    let points = p.getPoints()
    assert.equal(points.length, 2)
})

it('contains', () => {
    let p = new Polygon([
        new Vector(0,0,0),
        new Vector(0,2,0),
        new Vector(2,2,0),
        new Vector(2,0,0)
    ])

    assert(p.contains(new Vector(1,1,0)))
    assert(!p.contains(new Vector(3,1,0)))
})

it('inset', () => {
    let p = new Polygon([
        new Vector(0,0,0),
        new Vector(1,1,0),
        new Vector(2,0,0)
    ])
    let insetP = p.inset(0.1)

    // Make sure original unchanged.
    let points = p.getPoints()
    assert.equal(points[0].x, 0)
    assert.equal(points[1].x, 1)
    assert.equal(points[2].x, 2)

    // Check inset.
    points = insetP.getPoints()

    assert(Math.abs(points[0].x - 0.24) < 0.01, points[0].x)
    assert(Math.abs(points[0].y - 0.1) < 0.01, points[0].y)
    
    assert(Math.abs(points[1].x - 1) < 0.01, points[1].x)
    assert(Math.abs(points[1].y - 0.85) < 0.01, points[1].y)
    
    assert(Math.abs(points[2].x - 1.76) < 0.01, points[2].x)
    assert(Math.abs(points[2].y - 0.1) < 0.01, points[2].y)
})

it('path', () => { console.log(process.env.PATH) })