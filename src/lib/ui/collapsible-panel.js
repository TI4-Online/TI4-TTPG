const assert = require("../../wrapper/assert-wrapper");
const TriggerableMulticastDelegate = require("../triggerable-multicast-delegate");
const { ThrottleClickHandler } = require("./throttle-click-handler");
const {
    Border,
    HorizontalAlignment,
    HorizontalBox,
    ImageButton,
    LayoutBox,
    PlayerPermission,
    ScreenUIElement,
    Text,
    UIElement,
    VerticalAlignment,
    VerticalBox,
    Widget,
    refPackageId,
    world,
} = require("../../wrapper/api");

const UNSCALED_FONT_SIZE = 14;
const UNSCALED_SPACING = 2;

const IMG_CLOSE = "global/ui/icons/close.png";
const IMG_COLLAPSE = "global/ui/icons/collapse.png";
const IMG_EXPAND = "global/ui/icons/expand.png";
const IMG_SCREEN_SPACE = "global/ui/icons/hex.png";

/**
 * Wrap a Widget inside a panel with a "collapse/expand" toggle.
 */
class CollapsiblePanel {
    /**
     * Constructor.
     */
    constructor() {
        this._child = undefined;
        this._color = [0.1, 0.1, 0.1, 1];
        this._isClosable = false;
        this._title = undefined;
        this._scale = 1;

        this._onClosed = new TriggerableMulticastDelegate();
        this._onToggled = new TriggerableMulticastDelegate();
        this._onScreenSpaceToggled = new TriggerableMulticastDelegate();
    }

    get onClosed() {
        return this._onClosed;
    }

    get onToggled() {
        return this._onToggled;
    }

    get onScreenSpaceToggled() {
        return this._onScreenSpaceToggled;
    }

    setChild(child) {
        assert(child instanceof Widget);
        this._child = child;
        return this;
    }

    setClosable(isClosable) {
        assert(typeof isClosable === "boolean");
        this._isClosable = isClosable;
        return this;
    }

    setColor(color) {
        assert(Array.isArray(color) || typeof color.r === "number");
        this._color = color;
        return this;
    }

    /**
     * Recommend 2 for screen space.
     *
     * @param {number} scale
     * @returns {CollapsiblePanel} self, for chaining.
     */
    setScale(scale) {
        assert(typeof scale === "number");
        assert(scale > 0);
        this._scale = scale;
        return this;
    }

    setTitle(title) {
        assert(typeof title === "string");
        this._title = title;
        return this;
    }

    close(player) {
        console.log(`CollapsiblePanel.close "${this._title}"`);

        // If added by createAndAddUI this will remove the UI.
        this._onClosed.trigger(player);
    }

    createWidget() {
        assert(this._child);
        assert(this._title);
        this._child.setVisible(true);

        const fontSize = Math.floor(UNSCALED_FONT_SIZE * this._scale);
        const imgSize = Math.floor(UNSCALED_FONT_SIZE * this._scale);
        const spacing = Math.floor(UNSCALED_SPACING * this._scale);

        const titleText = new Text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(fontSize)
            .setText(this._title.toUpperCase());

        const titleBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(titleText);

        const screenSpaceButton = new ImageButton()
            .setImage(IMG_SCREEN_SPACE, refPackageId)
            .setImageSize(imgSize, imgSize);
        screenSpaceButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const playerName = world.TI4.getNameByPlayerSlot(
                    player.getSlot()
                );
                console.log(
                    `CollapsiblePanel "${this._title}" screen space toggled by "${playerName}"`
                );
                this._onScreenSpaceToggled.trigger(player);
            })
        );

        // NOT READY FOR THIS YET!
        screenSpaceButton.setVisible(false);

        const collapseButton = new ImageButton()
            .setImage(IMG_COLLAPSE, refPackageId)
            .setImageSize(imgSize, imgSize);
        collapseButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const playerName = world.TI4.getNameByPlayerSlot(
                    player.getSlot()
                );
                console.log(
                    `CollapsiblePanel "${this._title}" toggled by "${playerName}"`
                );
                const oldValue = this._child.isVisible();
                const newValue = !oldValue;
                this._child.setVisible(newValue);
                collapseButton.setImage(
                    newValue ? IMG_COLLAPSE : IMG_EXPAND,
                    refPackageId
                );
                this._onToggled.trigger(player);
            })
        );

        const closeButton = new ImageButton()
            .setImage(IMG_CLOSE, refPackageId)
            .setImageSize(imgSize, imgSize)
            .setEnabled(this._isClosable);
        closeButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const playerName = world.TI4.getNameByPlayerSlot(
                    player.getSlot()
                );
                console.log(
                    `CollapsiblePanel "${this._title}" closed by "${playerName}"`
                );
                this._onClosed.trigger(player);
            })
        );

        const headerPanel = new HorizontalBox()
            .setChildDistance(spacing)
            .addChild(titleBox, 1)
            .addChild(screenSpaceButton)
            .addChild(collapseButton)
            .addChild(closeButton);

        const panel = new VerticalBox()
            .setChildDistance(spacing)
            .addChild(headerPanel)
            .addChild(new Border().setColor([0.02, 0.02, 0.02, 1]))
            .addChild(this._child);

        const padded = new LayoutBox()
            .setPadding(spacing, spacing, spacing, spacing)
            .setChild(panel)
            .setMinimumWidth(150 * this._scale);

        return new Border().setColor(this._color).setChild(padded);
    }

    /**
     * Add the widget and UI to a player desk.
     *
     * Call close on the returned CollapsiblePanel if needed.
     *
     * @param {Vector} localPos
     * @param {Rotator} localRot
     * @param {PlayerDesk} playerDesk
     * @returns {CollapsiblePanel}
     */
    createAndAddUi(localPos, localRot, playerDesk) {
        assert(typeof localPos.x === "number"); // instanceof Vector broken
        assert(typeof localRot.yaw === "number"); // instanceof Rotator broken
        assert(playerDesk instanceof world.TI4.PlayerDesk);

        const widget = this.createWidget();

        const worldPos = playerDesk.localPositionToWorld(localPos);
        const worldRot = playerDesk.localRotationToWorld(localRot);

        this._uiElement = new UIElement();
        this._uiElement.anchorY = 1;
        this._uiElement.position = worldPos;
        this._uiElement.rotation = worldRot;
        this._uiElement.scale = 1 / this._scale;
        this._uiElement.widget = widget;

        playerDesk.addUI(this._uiElement);

        this.onClosed.add((player) => {
            if (this._uiElement) {
                playerDesk.removeUIElement(this._uiElement);
                this._uiElement = undefined;
            }
        });

        // Ability to move to screen space!
        this.onScreenSpaceToggled.add((player) => {
            if (this._uiElement) {
                // Remove from world.
                playerDesk.removeUIElement(this._uiElement);
                this._uiElement = undefined;

                // Need size widget.  Make a full screen box and center.
                const box = new LayoutBox()
                    .setHorizontalAlignment(HorizontalAlignment.Center)
                    .setVerticalAlignment(VerticalAlignment.Center)
                    .setChild(widget);

                // Add to screen.
                this._screenUiElement = new ScreenUIElement();
                this._screenUiElement.anchorX = 0.5;
                this._screenUiElement.anchorY = 0.5;
                this._screenUiElement.positionX = 0.5;
                this._screenUiElement.positionY = 0.5;
                this._screenUiElement.relativePositionX = true;
                this._screenUiElement.relativePositionY = true;
                this._screenUiElement.width = 1;
                this._screenUiElement.height = 1;
                this._screenUiElement.relativeWidth = true;
                this._screenUiElement.relativeHeight = true;
                this._screenUiElement.widget = box;
                this._screenUiElement.players =
                    new PlayerPermission().setPlayerSlots([
                        playerDesk.playerSlot,
                    ]);
                world.addScreenUI(this._screenUiElement);
            } else {
                // Remove from screen.
                world.removeScreenUIElement(this._screenUiElement);
                this._screenUiElement = undefined;

                // Add to world.
                this._uiElement = new UIElement();
                this._uiElement.anchorY = 1;
                this._uiElement.position = worldPos;
                this._uiElement.rotation = worldRot;
                this._uiElement.scale = 1 / this._scale;
                this._uiElement.widget = widget;
                playerDesk.addUI(this._uiElement);
            }
        });

        return this;
    }
}

module.exports = { CollapsiblePanel };
