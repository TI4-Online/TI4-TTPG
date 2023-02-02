/**
 * Too many global drawing lines can currently yield a table too large to
 * serialize for network synchronization.  TTPG will fix this in a future
 * update, but for now (Feb 1, 2023) periodically scrub excess lines.
 *
 * Serialization size = numPoints * 26 + numLines * 60
 */

const simplify = require("simplify-js");
const { AsyncTaskQueue } = require("../lib/async-task-queue/async-task-queue");
const { Broadcast } = require("../lib/broadcast");
const { Vector, world } = require("../wrapper/api");

const _asyncTaskQueue = new AsyncTaskQueue();
let _simplifyCount = 0;

function getExcessDrawingLines() {
    let numPoints = 0;
    let numLines = 0;
    let size = 0;
    const excess = [];
    for (const line of world.getDrawingLines()) {
        numPoints += line.points.length;
        numLines += 1;
        size = numPoints * 26 + numLines * 60;
        if (size > 50 * 1024) {
            excess.push(line);
        }
    }
    if (excess.length > 0) {
        console.log(
            `getExcessDrawingLines: |size|=${size}, numLines=${numLines}, excess=${excess.length}`
        );
    }

    return excess;
}

function simplifyOneLine(line, tag) {
    // Make sure line is still active and hasn't already been processed.
    let found = false;
    for (const candidate of world.getDrawingLines()) {
        if (candidate.tag === tag) {
            found = true;
            line = candidate; // paranoia
            break;
        }
    }
    if (!found) {
        console.log("simplifyOneLine: line missing, skipping " + tag);
        return;
    }

    // Remove before mutating, removing resets line.
    world.removeDrawingLineObject(line);

    // Simplify.
    const z = line.points[0].z;
    let xyPoints = line.points.map((point) => {
        return { x: point.x, y: point.y };
    });
    const tolerance = 0.1;
    const highQuality = true;
    xyPoints = simplify(xyPoints, tolerance, highQuality);
    console.log(
        `simplifyOneLine: |old|=${line.points.length} |new|=${xyPoints.length}`
    );

    // Update line.
    line.points = xyPoints.map((point) => {
        return new Vector(point.x, point.y, z);
    });
    line.normals = [new Vector(0, 0, 1)];
    line.tag = "__simplified__";
    world.addDrawingLine(line);
}

function simplifyAllLines() {
    for (const line of world.getDrawingLines()) {
        if (line.tag) {
            continue;
        }
        const tag = `__simplify_pending__${_simplifyCount++}`;
        world.removeDrawingLineObject(line);
        line.tag = tag;
        world.addDrawingLine(line);
        _asyncTaskQueue.add(() => {
            simplifyOneLine(line, tag);
        });
    }
}

function pruneExcessDrawingLines() {
    const excess = getExcessDrawingLines();
    if (excess.length === 0) {
        return;
    }

    const msg = `Pruning ${excess.length} excess lines`;
    Broadcast.chatAll(msg, Broadcast.ERROR);

    for (const line of excess) {
        world.removeDrawingLineObject(line);
    }
}

function simlifyAndPruneLines() {
    simplifyAllLines();

    // Simplify queues new lines.  Wait for simplify to finish before prune.
    _asyncTaskQueue.add(() => {
        pruneExcessDrawingLines();
    });
}

if (!world.__isMock) {
    setInterval(simlifyAndPruneLines, 5000);
}
