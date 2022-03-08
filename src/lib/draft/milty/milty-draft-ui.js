const { MiltySliceUI, DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const {
    Border,
    Color,
    HorizontalBox,
    LayoutBox,
    VerticalBox,
} = require("../../../wrapper/api");

const PADDING = 10;

class MiltyDraftUI extends LayoutBox {
    constructor(scale = DEFAULT_SLICE_SCALE) {
        super();
        this._scale = scale;

        this._sliceLayouts = [
            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),
        ];

        this._factionLayouts = [
            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),
            new LayoutBox(),
        ];

        this._orderLayouts = [
            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),

            new LayoutBox(),
            new LayoutBox(),
        ];

        const [w, h] = MiltySliceUI.getSize(scale);
        const pad = PADDING * this._scale;

        for (const layoutBox of this._sliceLayouts) {
            layoutBox.setOverrideWidth(w).setOverrideHeight(h);
            layoutBox.setChild(
                new Border().setChild(
                    new MiltySliceUI(scale).setSlice(
                        "1 2 3 4 5",
                        new Color(1, 0, 0),
                        "foo"
                    )
                )
            );
        }
        for (const layoutBox of this._factionLayouts) {
            layoutBox.setOverrideWidth(w).setOverrideHeight(h / 2 - pad / 2);
            layoutBox.setChild(new Border());
        }
        for (const layoutBox of this._orderLayouts) {
            layoutBox.setOverrideWidth(w).setOverrideHeight(h / 2 - pad / 2);
            layoutBox.setChild(new Border());
        }

        const col1 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[0])
            .addChild(this._sliceLayouts[3])
            .addChild(this._sliceLayouts[6]);
        const col2 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[1])
            .addChild(this._sliceLayouts[4])
            .addChild(this._sliceLayouts[7]);
        const col3 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[2])
            .addChild(this._sliceLayouts[5])
            .addChild(this._sliceLayouts[8]);
        const col4 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[0])
            .addChild(this._factionLayouts[3])
            .addChild(this._factionLayouts[6])
            .addChild(this._factionLayouts[9])
            .addChild(this._orderLayouts[0])
            .addChild(this._orderLayouts[3]);
        const col5 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[1])
            .addChild(this._factionLayouts[4])
            .addChild(this._factionLayouts[7])
            .addChild(this._factionLayouts[10])
            .addChild(this._orderLayouts[1])
            .addChild(this._orderLayouts[4]);
        const col6 = new VerticalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[2])
            .addChild(this._factionLayouts[5])
            .addChild(this._factionLayouts[8])
            .addChild(this._factionLayouts[11])
            .addChild(this._orderLayouts[2])
            .addChild(this._orderLayouts[5]);
        const overallPanel = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(col1)
            .addChild(col2)
            .addChild(col3)
            .addChild(col4)
            .addChild(col5)
            .addChild(col6);

        this.setPadding(pad, pad, pad, pad)
            .setChild(this._columns)
            .setChild(overallPanel);
    }
}

module.exports = { MiltyDraftUI };
