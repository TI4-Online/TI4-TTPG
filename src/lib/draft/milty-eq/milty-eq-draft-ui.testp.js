const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { DEFAULT_SLICE_SCALE } = require("./milty-eq-slice-ui");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { SeatTokenUI } = require("../milty/seat-token-ui");
const {
    Color,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../../../wrapper/api");
const { MiltyEqDraftUI } = require("./milty-eq-draft-ui");

const scale = DEFAULT_SLICE_SCALE;

const SLICES = [
    {
        slice: [1, 2, 3, 4],
        color: new Color(1, 0, 0),
        label: "# A",
    },
    {
        slice: [6, 7, 8, 9],
        color: new Color(0, 1, 0),
        label: "# B",
    },
    {
        slice: [11, 12, 13, 14],
        color: new Color(0, 0, 1),
        label: "# C",
    },
    {
        slice: [16, 17, 18, 19],
        color: new Color(1, 0, 1),
        label: "Longer Name That Wraps",
    },
    {
        slice: [21, 22, 23, 24],
        color: new Color(1, 1, 0),
        label: "# E",
    },
    {
        slice: [26, 27, 28, 29],
        color: new Color(0, 0, 1),
        label: "# F",
    },
    {
        slice: [31, 32, 33, 34],
        color: new Color(1, 0, 1),
        label: "# G",
    },
];

const FACTIONS = [
    { nsidName: "arborec" },
    { nsidName: "ul" },
    { nsidName: "letnev" },
    { nsidName: "l1z1x" },
    { nsidName: "hacan" },
    { nsidName: "creuss" },
    { nsidName: "muaat" },
    //{ nsidName: "nekro" },
];

const SEATS = SeatTokenUI.getSeatDataArray(2);

const manager = new DraftSelectionManager().setBorderSize(4 * scale);

const sliceCategoryName = locale("ui.draft.category.slice");
const factionCategoryName = locale("ui.draft.category.faction");
const seatCategoryName = locale("ui.draft.category.seat");

SLICES.forEach((sliceData) => {
    sliceData.onClickedGenerator = manager.createOnClickedGenerator(
        sliceCategoryName,
        sliceData.label,
        sliceData
    );
});
FACTIONS.forEach((factionData) => {
    const faction = world.TI4.getFactionByNsidName(factionData.nsidName);
    assert(faction);
    factionData.onClickedGenerator = manager.createOnClickedGenerator(
        factionCategoryName,
        faction.nameFull,
        factionData
    );
});
SEATS.forEach((seatData) => {
    seatData.onClickedGenerator = manager.createOnClickedGenerator(
        seatCategoryName,
        (seatData.orderIndex + 1).toString(),
        seatData
    );
});

function buildDemo(pos) {
    const onFinishedButton = manager.createOnFinishedButton();

    const playerDesk = {};
    const { widget, w, h } = new MiltyEqDraftUI(playerDesk, scale)
        .addSlices(SLICES)
        .addEqs([40, 41, 42, 43, 44, 45], SEATS)
        .addFactions(FACTIONS)
        .addSeats(SEATS)
        .getWidgetAndSize(onFinishedButton);
    console.log(`draft ${w}x${h}`);

    const ui = new UIElement();
    ui.width = w;
    ui.height = h;
    ui.useWidgetSize = false;
    ui.position = pos;
    ui.widget = widget;
    ui.scale = 1 / scale;

    refObject.addUI(ui);
}

buildDemo(new Vector(0, 0, 6));
buildDemo(new Vector(0, -80, 6));
