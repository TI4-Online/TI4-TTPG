const assert = require("../../../wrapper/assert-wrapper");
const { MiltySliceUI, DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const {
    Border,
    Color,
    HorizontalAlignment,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    VerticalBox,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const PADDING = 10;

class MiltyDraftUI extends LayoutBox {
    constructor(scale = DEFAULT_SLICE_SCALE) {
        super();
        this._scale = scale;

        const pad = PADDING * this._scale;
        const [w, h] = MiltySliceUI.getSize(scale);

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
        for (const layoutBox of this._sliceLayouts) {
            layoutBox.setOverrideWidth(w).setOverrideHeight(h);
        }
        const slicesRow1 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[0])
            .addChild(this._sliceLayouts[1])
            .addChild(this._sliceLayouts[2]);
        const slicesRow2 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[3])
            .addChild(this._sliceLayouts[4])
            .addChild(this._sliceLayouts[5]);
        const slicesRow3 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._sliceLayouts[6])
            .addChild(this._sliceLayouts[7])
            .addChild(this._sliceLayouts[8]);
        const slicesPanel = new VerticalBox()
            .setChildDistance(pad)
            .addChild(slicesRow1)
            .addChild(slicesRow2)
            .addChild(slicesRow3);

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
        for (const layoutBox of this._factionLayouts) {
            layoutBox.setOverrideWidth(w).setOverrideHeight(h / 2 - pad / 2);
            //layoutBox.setChild(new Border());
        }
        const factionsRow1 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[0])
            .addChild(this._factionLayouts[1])
            .addChild(this._factionLayouts[2]);
        const factionsRow2 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[3])
            .addChild(this._factionLayouts[4])
            .addChild(this._factionLayouts[5]);
        const factionsRow3 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[6])
            .addChild(this._factionLayouts[7])
            .addChild(this._factionLayouts[8]);
        const factionsRow4 = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(this._factionLayouts[9])
            .addChild(this._factionLayouts[10])
            .addChild(this._factionLayouts[11]);
        const factionsPanel = new VerticalBox()
            .setChildDistance(pad)
            .addChild(factionsRow1)
            .addChild(factionsRow2)
            .addChild(factionsRow3)
            .addChild(factionsRow4);

        this._orderLayouts = [];
        const orderRow1 = new HorizontalBox().setChildDistance(pad);
        const orderRow2 = new HorizontalBox().setChildDistance(pad);
        for (let i = 0; i < world.TI4.config.playerCount; i++) {
            const orderLayout = new LayoutBox();
            this._orderLayouts.push(orderLayout);
            if (i < world.TI4.config.playerCount / 2) {
                orderRow1.addChild(orderLayout);
            } else {
                orderRow2.addChild(orderLayout);
            }
        }
        const cols = Math.ceil(this._orderLayouts.length / 2);
        const orderWidth = (w * 3 + pad * 2 - (cols - 1) * pad) / cols;
        for (const layoutBox of this._orderLayouts) {
            layoutBox
                .setOverrideHeight(h / 2 - pad / 2)
                .setOverrideWidth(orderWidth);
            layoutBox.setChild(new Border());
        }
        const orderPanel = new VerticalBox()
            .setChildDistance(pad)
            .addChild(orderRow1)
            .addChild(orderRow2);

        for (const layoutBox of this._sliceLayouts) {
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
            let img = new ImageWidget()
                .setImage("global/factions/arborec_icon.png", refPackageId)
                .setImageSize(h, h);
            img = new Border().setChild(img);
            const imgBox = new LayoutBox()
                .setOverrideHeight(h)
                .setOverrideWidth(h);
            //.setChild(img);
            const centeredBox = new HorizontalBox()
                .setHorizontalAlignment(HorizontalAlignment.Center)
                .addChild(imgBox);
            layoutBox.setChild(img);
        }

        const overallPanel = new HorizontalBox()
            .setChildDistance(pad)
            .addChild(slicesPanel)
            .addChild(
                new VerticalBox()
                    .setChildDistance(pad)
                    .addChild(factionsPanel)
                    .addChild(orderPanel)
            );

        this.setPadding(pad, pad, pad, pad)
            .setChild(this._columns)
            .setChild(overallPanel);
    }

    setSlices(miltySlices) {
        assert(Array.isArray(miltySlices));
        // XXX TODO
    }

    setFactions(factionNames) {
        assert(Array.isArray(factionNames));
        // XXX TODO
    }
}

module.exports = { MiltyDraftUI };
