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
    Rotator,
    ScreenUIElement,
    Text,
    UIElement,
    Vector,
    VerticalAlignment,
    VerticalBox,
    Widget,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");
const locale = require("../locale");
const { spacerColor } = require("../../game-ui/game-ui-config");

const UNSCALED_FONT_SIZE = 14;
const UNSCALED_SPACING = 2;

const IMG_CLOSE = "global/ui/icons/close.png";
const IMG_COLLAPSE = "global/ui/icons/collapse.png";
const IMG_EXPAND = "global/ui/icons/expand.png";
const IMG_SCREEN_SPACE = "global/ui/icons/hex.png";

const LOCAL_POS = new Vector(10, 0, 5);
const LOCAL_POS_DELTA = new Vector(-2, 0, 0); // if stacking multiple
const LOCAL_ROT = new Rotator(35, 0, 0);

const _deskIndexToCollapsiblePanels = {};

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
        this._playerDeskIndex = undefined;
        this._scale = 1;
        this._title = undefined;

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

    setPlayerDeskIndex(deskIndex) {
        assert(typeof deskIndex === "number");
        this._playerDeskIndex = deskIndex;
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

    // --------------------------------

    close(player) {
        console.log(`CollapsiblePanel.close "${this._title}"`);

        // If added by createAndAddUI this will remove the UI.
        this._onClosed.trigger(player);
    }

    createWidget() {
        assert(this._child);
        assert(this._title);
        assert(this._playerDeskIndex !== undefined);

        // Reset visibility just in case.
        this._child.setVisible(true);

        const fontSize = Math.floor(UNSCALED_FONT_SIZE * this._scale);
        const imgSize = Math.floor(UNSCALED_FONT_SIZE * this._scale);
        const spacing = Math.floor(UNSCALED_SPACING * this._scale);

        // Place whole thing in an outer frame.  This lets us change the
        // padding and/or color to emphasize the collapsed version.
        const outerBox = new LayoutBox().setPadding(
            spacing,
            spacing,
            spacing,
            spacing
        );
        const outerBorder = new Border()
            .setColor(spacerColor)
            .setChild(outerBox);

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

                // Restrict clicks to player seated at desk!
                const clickingPlayerSlot = player.getSlot();
                const playerDesk =
                    world.TI4.getAllPlayerDesks()[this._playerDeskIndex];
                const deskPlayerSlot = playerDesk.playerSlot;
                if (clickingPlayerSlot !== deskPlayerSlot) {
                    const playerName =
                        world.TI4.getNameByPlayerSlot(clickingPlayerSlot);
                    const msg = locale("ui.error.not_owner", { playerName });
                    Broadcast.broadcastOne(player, msg, Broadcast.ERROR);
                    return;
                }

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
            .addChild(new Border().setColor(spacerColor))
            .addChild(this._child);

        const padded = new LayoutBox()
            .setPadding(spacing, spacing, spacing, spacing)
            .setChild(panel)
            .setMinimumWidth(150 * this._scale);

        const border = new Border().setColor(this._color).setChild(padded);

        outerBox.setChild(border);
        return outerBorder;
    }

    /**
     * Add the widget and UI to a player desk, manage UI lifecycle.
     *
     * Call close on the returned CollapsiblePanel if needed.
     *
     * @param {Vector} localPos
     * @param {Rotator} localRot
     * @returns {CollapsiblePanel}
     */
    createAndAddUi() {
        assert(this._playerDeskIndex !== undefined);
        const deskIndex = this._playerDeskIndex;

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);

        const widget = this.createWidget();

        const worldPos = playerDesk.localPositionToWorld(LOCAL_POS);
        const worldRot = playerDesk.localRotationToWorld(LOCAL_ROT);

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
            if (this._screenUiElement) {
                world.removeScreenUIElement(this._screenUiElement);
                this._screenUiElement = undefined;
            }
        });

        // Ability to move to screen space!
        this.onScreenSpaceToggled.add((player) => {
            if (this._uiElement) {
                // Remove from world.
                playerDesk.removeUIElement(this._uiElement);
                this._uiElement.widget = undefined;
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
            } else if (this._screenUiElement) {
                // Remove from screen.
                world.removeScreenUIElement(this._screenUiElement);
                this._screenUiElement.widget = undefined;
                this._screenUiElement = undefined;

                // It had a parent on screen, strip parent.
                const box = widget.getParent();
                if (box) {
                    box.setChild(undefined);
                }

                // Add to world.
                this._uiElement = new UIElement();
                this._uiElement.anchorY = 1;
                this._uiElement.position = worldPos;
                this._uiElement.rotation = worldRot;
                this._uiElement.scale = 1 / this._scale;
                this._uiElement.widget = widget;
                playerDesk.addUI(this._uiElement);
            } else {
                console.log(
                    "CollapsiblePanel.onScreenSpaceToggled: neither world nor screen (??)"
                );
            }
        });

        // Stack concurrent panels.  Keep order if warped to screen.
        if (this._uiElement) {
            this._addDeskCollapsiblePanel();
        }
        this.onClosed.add((player) => {
            this._delDeskCollapsiblePanel();
        });
        this.onScreenSpaceToggled.add((player) => {
            //CollapsiblePanel._restackPerDeskCollapsiblePanels(deskIndex);
        });

        return this;
    }

    _addDeskCollapsiblePanel() {
        assert(this._playerDeskIndex !== undefined);
        const deskIndex = this._playerDeskIndex;

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);

        let panels = _deskIndexToCollapsiblePanels[deskIndex];
        if (!panels) {
            panels = [];
            _deskIndexToCollapsiblePanels[deskIndex] = panels;
        }

        // Paranoia: remove if already there.
        const delIndex = panels.indexOf(this);
        if (delIndex >= 0) {
            panels.splice(delIndex, 1);
        }

        // Now add.
        panels.push(this);

        CollapsiblePanel._restackPerDeskCollapsiblePanels(deskIndex);
    }

    _delDeskCollapsiblePanel() {
        const deskIndex = this._playerDeskIndex;
        let panels = _deskIndexToCollapsiblePanels[deskIndex];
        if (!panels) {
            panels = [];
            _deskIndexToCollapsiblePanels[deskIndex] = panels;
        }
        const delIndex = panels.indexOf(this);
        if (delIndex >= 0) {
            panels.splice(delIndex, 1);
        }

        // Only restack when adding!  Otherwise leave things where they are.
    }

    static _restackAllCollapsiblePanels() {
        const playerDesks = world.TI4.getAllPlayerDesks();
        for (const playerDesk of playerDesks) {
            CollapsiblePanel._restackPerDeskCollapsiblePanels(playerDesk);
        }
    }

    static _restackPerDeskCollapsiblePanels(deskIndex) {
        assert(typeof deskIndex === "number");

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);

        const collapsiblePanels = _deskIndexToCollapsiblePanels[deskIndex];
        if (!collapsiblePanels) {
            return; // never registered
        }
        assert(Array.isArray(collapsiblePanels));

        let localPos = LOCAL_POS.clone();
        const worldRot = playerDesk.localRotationToWorld(LOCAL_ROT);
        for (const collapsiblePanel of collapsiblePanels) {
            if (!collapsiblePanel._uiElement) {
                continue; // screen space
            }

            const worldPos = playerDesk.localPositionToWorld(localPos);
            collapsiblePanel._uiElement.position = worldPos;
            collapsiblePanel._uiElement.rotation = worldRot; // need to update BOTH pos/rot
            const updatePosition = true;
            playerDesk.updateUI(collapsiblePanel._uiElement, updatePosition);

            localPos = localPos.add(LOCAL_POS_DELTA);
        }
    }
}

module.exports = { CollapsiblePanel };
