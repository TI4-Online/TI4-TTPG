const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { Border } = require("@tabletop-playground/api");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { MiltyDraftUI } = require("./milty-draft-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const {
    Canvas,
    Color,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../../../wrapper/api");

const scale = DEFAULT_SLICE_SCALE;

const canvas = new Canvas();
const miltyDraftUI = new MiltyDraftUI(canvas, scale);

const SLICES = [
    {
        slice: [1, 2, 3, 4, 5],
        color: new Color(1, 0, 0),
        label: "Slice A",
    },
    {
        slice: [6, 7, 8, 9, 10],
        color: new Color(0, 1, 0),
        label: "Slice B",
    },
    {
        slice: [11, 12, 13, 14, 15],
        color: new Color(0, 0, 1),
        label: "Slice C",
    },
    {
        slice: [16, 17, 18, 19, 20],
        color: new Color(1, 0, 1),
        label: "Longer Slice Name That Wraps",
    },
    {
        slice: [21, 22, 23, 24, 25],
        color: new Color(1, 1, 0),
        label: "Slice E",
    },
    {
        slice: [26, 27, 28, 29, 30],
        color: new Color(0, 0, 1),
        label: "Slice F",
    },
    {
        slice: [31, 32, 33, 34, 35],
        color: new Color(1, 0, 1),
        label: "Slice G",
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
    { nsidName: "nekro" },
];

const SEATS = SeatTokenUI.getSeatDataArray(-1);

const sliceCategoryName = locale("ui.draft.category.slice");
const factionCategoryName = locale("ui.draft.category.faction");
const seatCategoryName = locale("ui.draft.category.seat");
const manager = new DraftSelectionManager()
    .setBorderSize(4 * scale)
    .addCategory(sliceCategoryName)
    .addCategory(factionCategoryName)
    .addCategory(seatCategoryName);
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

miltyDraftUI.addSlices(SLICES).addFactions(FACTIONS).addSeats(SEATS);
const [w, h] = miltyDraftUI.getSize();
console.log(`draft ${w}x${h}`);

const ui = new UIElement();
ui.width = w;
ui.height = h;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, 6);
ui.widget = new Border().setChild(canvas);
ui.scale = 1 / scale;

refObject.addUI(ui);
