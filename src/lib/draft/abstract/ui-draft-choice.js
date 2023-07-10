const assert = require("../../../wrapper/assert-wrapper");
const {
    Border,
    Canvas,
    ContentButton,
    LayoutBox,
    world,
} = require("../../../wrapper/api");

const NO_OWNER_BORDER_COLOR = [0, 0, 0, 1];

class UiDraftChoice {
    constructor(uiWrapped) {
        assert(typeof uiWrapped === "object");
        assert(typeof uiWrapped.getSize === "function");
        assert(typeof uiWrapped.drawToCanvas === "function");
        this._uiWrapped = uiWrapped;

        this._allowToggle = (uiDraftChoice, playerSlot) => {
            return true;
        };
        this._owningPlayerSlot = -1;
        this._frameSize = 2;
        this._paddingSize = 2;
        this._scale = 1;
    }

    setAllowToggle(allowToggle) {
        assert(typeof allowToggle === "function");
        this._allowToggle = allowToggle;
        return this;
    }

    setFrameSize(frameSize) {
        assert(typeof frameSize === "number");
        this._frameSize = frameSize;
        return this;
    }

    setOwningPlayerSlot(playerSlot) {
        assert(typeof playerSlot === "number");
        this._owningPlayerSlot = playerSlot;
        if (this._border) {
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                this._owningPlayerSlot
            );
            const color = playerDesk
                ? playerDesk.widgetColor
                : NO_OWNER_BORDER_COLOR;
            this._border.setColor(color);
        }

        return this;
    }

    setPaddingSize(paddingSize) {
        assert(typeof paddingSize === "number");
        this._paddingSize = paddingSize;
        return this;
    }

    setScale(scale) {
        assert(typeof scale === "number");
        this._scale = scale;
        return this;
    }

    getSize() {
        const { w, h } = this._uiWrapped.getSize();
        assert(typeof w === "number");
        assert(typeof h === "number");
        const frame = Math.ceil(this._frameSize * this._scale);
        const padding = Math.ceil(this._paddingSize * this._scale);
        return {
            frame,
            padding,
            w: w + (frame + padding) * 2,
            h: h + (frame + padding) * 2,
        };
    }

    createWidget() {
        const size = this.getSize();

        if (size) {
            const { frame, padding } = this.getSize();
            assert(typeof frame === "number");
            assert(typeof padding === "number");

            const innerBox = this._uiWrapped.createWidget();
            const paddedBox = new LayoutBox()
                .setPadding(padding, padding, padding, padding)
                .setChild(innerBox);

            const contentButton = new ContentButton().setChild(paddedBox);

            const frameBox = new LayoutBox()
                .setPadding(frame, frame, frame, frame)
                .setChild(contentButton);

            this._border = new Border()
                .setColor(NO_OWNER_BORDER_COLOR)
                .setChild(frameBox);

            contentButton.onClicked.add((button, player) => {
                const playerSlot = player.getSlot();
                const playerDesk =
                    world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
                if (this._allowToggle(this, playerSlot)) {
                    if (this._owningPlayerSlot === playerSlot) {
                        this._owningPlayerSlot = -1;
                        this._border.setColor(NO_OWNER_BORDER_COLOR);
                    } else {
                        assert(playerDesk);
                        this._owningPlayerSlot = playerSlot;
                        this._border.setColor(playerDesk.widgetColor);
                    }
                }
            });

            return this._border;
        }

        const canvas = new Canvas();

        const layoutBox = new LayoutBox()
            .setOverrideWidth(size.w)
            .setOverrideHeight(size.h)
            .setChild(canvas);

        canvas.addChild(
            new Border().setColor([1, 0, 0, 1]),
            0,
            0,
            size.w,
            size.h
        );

        //this.drawToCanvas(canvas);

        return layoutBox;
    }

    drawToCanvas(canvas, offset = { x: 0, y: 0 }) {
        assert(canvas instanceof Canvas);
        assert(typeof offset.x === "number");
        assert(typeof offset.y === "number");

        const { frame, padding, w, h } = this.getSize();
        assert(typeof frame === "number");
        assert(typeof padding === "number");
        assert(typeof w === "number");
        assert(typeof h === "number");

        console.log(
            JSON.stringify({
                offset,
                w,
                h,
            })
        );

        // Content button needs a new canvas.  This creates a canvas in an
        // appropriately sized layout box.
        const innerBox = this._uiWrapped.createWidget();

        const paddedBox = new LayoutBox()
            .setPadding(padding, padding, padding, padding)
            .setChild(innerBox);

        const contentButton = new ContentButton().setChild(paddedBox);

        const frameBox = new LayoutBox()
            .setPadding(frame, frame, frame, frame)
            .setChild(contentButton);

        this._border = new Border()
            .setColor(NO_OWNER_BORDER_COLOR)
            .setChild(frameBox);
        if (this._owningPlayerSlot >= 0) {
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                this._owningPlayerSlot
            );
            assert(playerDesk);
            this._border.setColor(playerDesk.widgetColor);
        }

        canvas.addChild(this._border, offset.x, offset.y, w, h);

        contentButton.onClicked.add((button, player) => {
            const playerSlot = player.getSlot();
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            if (this._allowToggle(this, playerSlot)) {
                if (this._owningPlayerSlot === playerSlot) {
                    this._owningPlayerSlot = -1;
                    this._border.setColor(NO_OWNER_BORDER_COLOR);
                } else {
                    assert(playerDesk);
                    this._owningPlayerSlot = playerSlot;
                    this._border.setColor(playerDesk.widgetColor);
                }
            }
        });

        return contentButton;
    }
}

module.exports = { UiDraftChoice };
