const { world } = require("../../wrapper/api");

module.exports = (data) => {
    data.setupTimestamp = world.TI4.config.timestamp;

    // Keep old style root-level for existing config values.
    data.isPoK = world.TI4.config.pok;
    data.scoreboard = world.TI4.config.gamePoints;

    if (world.TI4.fogOfWar.isEnabled()) {
        data.isFogOfWar = true;
    }
    if (world.TI4.config.franken) {
        data.isFranken = true;
    }

    // Gather new config values in a table.
    data.config = {
        codex1: world.TI4.config.codex1,
        codex2: world.TI4.config.codex2,
        codex3: world.TI4.config.codex3,
        codex4: world.TI4.config.codex4,
        baseMagen: world.TI4.config.baseMagen,
    };
};
