const { globalEvents, refObject, world } = require("../../wrapper/api");
const { PerfStats } = require("./perf-stats");

for (const obj of world.getAllObjects()) {
    if (obj !== refObject) {
        obj.destroy();
    }
}

const SHIP_TEMPLATE_ID = "D0BA93804175B8602BBF8F868C64CD32"; // dread orig
//const SHIP_TEMPLATE_ID = "0A439B4255486912202298A168E97A72"; // dread low poly
const HISTORY_SIZE = 100;
const DELAY_FRAMES = 10;
const perfStats = new PerfStats(HISTORY_SIZE);
let unitCount = 0;

let nextReportTick = -1;
setTimeout(() => {
    console.log(`obj-count-perf: template ${SHIP_TEMPLATE_ID}`);
    nextReportTick = perfStats.getTick() + HISTORY_SIZE + DELAY_FRAMES;
}, 1500);

const all = [];
globalEvents.onTick.add(() => {
    if (perfStats.getTick() !== nextReportTick) {
        return;
    }

    // Report for current ship count.
    const stats = perfStats.summarize();
    all.push(stats);
    console.log(
        `${String(unitCount).padStart(
            4,
            " "
        )} ships, frame usecs: median=${stats.median.toFixed(
            2
        )} mean=${stats.mean.toFixed(2)} stdDev=${stats.stdDev.toFixed(4)}`
    );

    // Spawn a new ship.
    const spawnCount = 100;
    for (let i = 0; i < spawnCount; i++) {
        const pos = [
            Math.random() * 160 - 80,
            Math.random() * 160 - 80,
            world.getTableHeight() + 10,
        ];
        const obj = world.createObjectFromTemplate(SHIP_TEMPLATE_ID, pos);
        obj.setObjectType(2); // penetrable
        obj.snapToGround();
    }
    unitCount += spawnCount;

    // Register for next report.
    nextReportTick = perfStats.getTick() + HISTORY_SIZE + DELAY_FRAMES;

    if (unitCount > 5000) {
        console.log(`obj-count-perf: template ${SHIP_TEMPLATE_ID}`);
        console.log(
            JSON.stringify(
                all.map((x) => {
                    return x.median;
                })
            )
        );
        nextReportTick = -1;
    }
});
