const assert = require("../../../wrapper/assert-wrapper");
const { DraftSelectionWidget } = require("../draft-selection-widget");
const { Faction } = require("../../faction/faction");
const {
    Canvas,
    ImageButton,
    LayoutBox,
    Text,
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

        const buttonTextRatio = 0.85;
        const buttonHeight = size.h * buttonTextRatio;
        const textHeight = size.h * (1 - buttonTextRatio);

        this._labelFontSize = Math.min(255, textHeight);
        this._labelBox = new LayoutBox();
        this._imageSize = Math.min(buttonHeight, size.w);

        canvas.addChild(
            this._labelBox,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            buttonHeight
        );

        this._factionText = new Text()
            .setJustification(1)
            .setFontSize(this._labelFontSize);

        canvas.addChild(
            this._factionText,
            canvasOffset.x,
            canvasOffset.y + buttonHeight,
            size.w,
            textHeight * 2 // double the height to aviod offsets cutting off the lower text part
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
        this._factionText.setText(faction.nameAbbr);
        const draftSelection = new DraftSelectionWidget().setChild(button);
        button.onClicked.add(onClickedGenerator(draftSelection));
        this._labelBox.setChild(draftSelection);
    }

    clear() {
        this._labelBox.setChild();
    }
}

module.exports = { FactionTokenUI };
