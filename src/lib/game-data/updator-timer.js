const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.timer = {
        seconds: 0, // current value
        anchorTimestamp: 0, // timestamp when started
        anchorSeconds: 0, // value when started
        direction: 0, // [-1, 0, 1]
        countDown: 0,
    };

    const timer = world.TI4.getTimer();

    // Abort if sus.
    if (!timer || !timer.__timer) {
        return;
    }

    data.timer.seconds = timer.__timer.getValue();
    data.timer.anchorTimestamp = timer.__timer.getAnchorTimestamp();
    data.timer.anchorSeconds = timer.__timer.getAnchorValue();
    data.timer.direction = timer.__timer.getDirection();
    data.timer.countDown = timer.__timer.getCountdownFrom();
};
