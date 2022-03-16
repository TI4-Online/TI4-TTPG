const assert = require("../../../wrapper/assert-wrapper");
const { DraftSelectionWidget } = require("../draft-selection-widget");
const { Faction } = require("../../faction/faction");
const {
    Canvas,
    ImageButton,
    ImageWidget,
    LayoutBox,
    refPackageId,
    world,
} = require("../../../wrapper/api");

class FactionTokenUI {
    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

        this._labelFontSize = Math.min(255, Math.floor(size.h * 0.3));
        this._labelBox = new LayoutBox();
        this._imageSize = Math.min(size.h, size.w);

        canvas.addChild(
            this._labelBox,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );
    }

    setFaction(factionNsidName, onClickedGenerator) {
        assert(typeof factionNsidName === "string");
        assert(typeof onClickedGenerator === "function");

        const faction = world.TI4.getFactionByNsidName(factionNsidName);
        if (!faction) {
            throw new Error(`unknown faction "${factionNsidName}`);
        }

        const button = new ImageButton()
            .setImageSize(this._imageSize, this._imageSize)
            .setImage(
                Faction.getByNsidName(factionNsidName).icon,
                refPackageId
            );
        this._factionIcon;
        const draftSelection = new DraftSelectionWidget().setChild(button);
        button.onClicked.add(onClickedGenerator(draftSelection));
        this._labelBox.setChild(draftSelection);
    }

    clear() {
        this._labelBox.setChild();
    }
}

module.exports = { FactionTokenUI };
