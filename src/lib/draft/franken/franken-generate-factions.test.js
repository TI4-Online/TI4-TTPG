require("../../../global");
const assert = require("assert");
const { FrankenGenerateFaction } = require("./franken-generate-faction");

it("gather", () => {
    FrankenGenerateFaction.gatherFactionDefinitions([]);
});
