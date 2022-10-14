const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { DEFAULT_SLICE_SCALE } = require("./bunker-slice-ui");
const { DraftSelectionManager } = require("../draft-selection-manager");
const { BunkerDraftUI } = require("./bunker-draft-ui");
const { SeatTokenUI } = require("../milty/seat-token-ui");
const {
    Color,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../../../wrapper/api");

const scale = DEFAULT_SLICE_SCALE;

const BUNKERS = [
    {
        bunker: [1, 2, 3, 4],
        color: new Color(1, 0, 0),
        label: "# A",
    },
    {
        bunker: [6, 7, 8, 9],
        color: new Color(0, 1, 0),
        label: "# B",
    },
    {
        bunker: [11, 12, 13, 14],
        color: new Color(0, 0, 1),
        label: "# C",
    },
    {
        bunker: [16, 17, 18, 19],
        color: new Color(1, 0, 1),
        label: "Longer Name That Wraps",
    },
    {
        bunker: [21, 22, 23, 24],
        color: new Color(1, 1, 0),
        label: "# E",
    },
    {
        bunker: [26, 27, 28, 29],
        color: new Color(0, 0, 1),
        label: "# F",
    },
    {
        bunker: [31, 32, 33, 34],
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

BUNKERS.forEach((bunkerData) => {
    bunkerData.onClickedGenerator = manager.createOnClickedGenerator(
        sliceCategoryName,
        bunkerData.label,
        bunkerData
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
    const { widget, w, h } = new BunkerDraftUI(playerDesk, scale)
        .addBunkers(BUNKERS)
        .addInnerRing([1, 2, 3, 4, 5, 6], SEATS)
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
