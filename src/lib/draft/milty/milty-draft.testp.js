const { MiltyDraft } = require("./milty-draft");
const { Color } = require("../../../wrapper/api");

const miltyDraft = new MiltyDraft();

miltyDraft
    .addSlice([1, 2, 3, 4, 5], new Color(1, 1, 0), "test1")
    .addSlice([6, 7, 8, 9, 10], new Color(0, 1, 1), "test2")
    .addFaction("arborec")
    .addFaction("ul")
    .setSpeakerIndex(1)
    .createUIs();
