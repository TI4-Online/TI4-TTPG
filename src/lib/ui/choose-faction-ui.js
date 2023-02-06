const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../../game-ui/game-ui-config");
const TriggerableMulticastDelegate = require("../triggerable-multicast-delegate");
const {
    Border,
    ContentButton,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
    world,
} = require("../../wrapper/api");

/**
 * UI Widget to select either one or a group of factions.
 * By default select just one, change to new on click.
 */
class ChooseFactionUi {
    /**
     * Get all available factions, in name order.
     *
     * @returns {Array.{Faction}}
     */
    static getOrderedFactions() {
        // getAllFactions accounts for using PoK, etc.
        const factions = world.TI4.getAllFactions();
        factions.sort((a, b) => {
            a = a.nameAbbr;
            b = b.nameAbbr;
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
        return factions;
    }

    constructor() {
        this._onFactionStateChanged = new TriggerableMulticastDelegate();
        this._selectedColor = [1, 1, 1, 1];
        this._deselectedColor = CONFIG.spacerColor;

        this._numCols = 6;
        this._fitNameLength = 8;
        this._buttonSize = undefined;

        this._selectMulitple = false;
        this._factionNsidNameToBorder = {};
        this._factionNsidNameToLabel = {};
        this._factionNsidNameToIsSelected = {};
    }

    /**
     * Callback after updating selection state.
     */
    get onFactionStateChanged() {
        return this._onFactionStateChanged;
    }

    /**
     * When creating widget, layout in N columns.
     *
     * @param {number} value
     * @returns {ChooseFactionUi} self, for chaining
     */
    setNumCols(value) {
        assert(typeof value === "number");
        this._numCols = value;
        return this;
    }

    /**
     * Shrink names longer than value.
     *
     * @param {number} value
     * @returns {ChooseFactionUi} self, for chaining
     */
    setFitNameLength(value) {
        assert(typeof value === "number");
        this._fitNameLength = value;
        return this;
    }

    /**
     * Fix button size.
     *
     * @param {w} width
     * @param {h} height
     * @returns {ChooseFactionUi} self, for chaining
     */
    setButtonSize(w, h) {
        assert(typeof w === "number");
        assert(typeof h === "number");
        this._buttonSize = { w, h };
        return this;
    }

    /**
     * Clicking more selects several, or unselects existing before single new?
     *
     * @param {boolean} value
     * @returns {ChooseFactionUi} self, for chaining
     */
    setAllowSelectMultiple(value) {
        assert(typeof value === "boolean");
        this._selectMulitple = value;
        return this;
    }

    /**
     * Manually select a faction.
     *
     * @param {Object} faction
     * @param {boolean} isSelected
     * @returns {ChooseFactionUi} self, for chaining
     */
    setIsSelected(faction, isSelected) {
        assert(typeof faction.nsidName === "string");
        assert(typeof isSelected === "boolean");

        // If not selecting multiple, deselect any current.
        if (isSelected && !this._selectMulitple) {
            const selected = this.getSelectedFactions();
            for (const selectedFaction of selected) {
                this.setIsSelected(selectedFaction, false);
            }
        }

        const nsidName = faction.nsidName;
        this._factionNsidNameToIsSelected[nsidName] = isSelected;
        const border = this._factionNsidNameToBorder[nsidName];
        if (border) {
            border.setColor(
                isSelected ? this._selectedColor : this._deselectedColor
            );
        }

        // Tell any listeners something *may* have changed.
        this._onFactionStateChanged.trigger();
        return this;
    }

    // --------------------------------

    /**
     * Is the given faction selected?
     *
     * @param {Object} faction
     * @returns {boolean}
     */
    isSelected(faction) {
        assert(typeof faction.nsidName === "string");
        const nsidName = faction.nsidName;
        return this._factionNsidNameToIsSelected[nsidName] ? true : false;
    }

    /**
     * Get selected faction objects.
     *
     * @returns {Array.{Object}}
     */
    getSelectedFactions() {
        const result = [];
        for (const [nsidName, selected] of Object.entries(
            this._factionNsidNameToIsSelected
        )) {
            if (selected) {
                const faction = world.TI4.getFactionByNsidName(nsidName);
                assert(faction);
                result.push(faction);
            }
        }
        return result;
    }

    /**
     * Create a new widget with faction selection buttons.  Only use one!
     *
     * @returns {Widget}
     */
    getWidget() {
        // Create panels.
        const widget = new HorizontalBox().setChildDistance(CONFIG.spacing);
        const cols = [];
        for (let i = 0; i < this._numCols; i++) {
            const col = new VerticalBox().setChildDistance(CONFIG.spacing);
            widget.addChild(col, 1);
            cols.push(col);
        }

        // Add faction buttons.
        const factions = ChooseFactionUi.getOrderedFactions();
        factions.forEach((faction, index) => {
            const colIndex = index % cols.length;
            const col = cols[colIndex];
            col.addChild(this._createFactionWidget(faction));
        });

        return widget;
    }

    _createFactionWidget(faction) {
        assert(typeof faction.nsidName === "string");

        // Shrink if name is very long.
        const name = faction.nameAbbr;
        let fontSize = Math.ceil(CONFIG.fontSize * 0.7);
        if (name.length > this._fitNameLength) {
            fontSize = Math.floor(
                (fontSize * this._fitNameLength) / name.length
            );
        }

        const imgSize = CONFIG.fontSize;
        const factionIcon =
            faction && faction.icon
                ? faction.icon
                : "global/factions/bobert_icon.png";
        const packageId =
            faction && faction.packageId ? faction.packageId : refPackageId;
        const icon = new ImageWidget()
            .setImageSize(imgSize, imgSize)
            .setImage(factionIcon, packageId);

        const label = new Text()
            .setAutoWrap(false)
            .setFontSize(fontSize)
            .setText(name);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(icon, 0)
            .addChild(label, 1);

        const contentButton = new ContentButton().setChild(panel);
        contentButton.onClicked = (button, player) => {
            this._toggle(faction);
        };

        const pad = Math.ceil(CONFIG.spacing * 0.5);
        const buttonBox = new LayoutBox()
            .setPadding(pad, pad, pad, pad)
            .setChild(contentButton);

        if (this._buttonSize) {
            buttonBox.setOverrideWidth(this._buttonSize.w);
            buttonBox.setOverrideHeight(this._buttonSize.h);
        }

        const isSelected = this.isSelected(faction);
        const border = new Border()
            .setColor(isSelected ? this._selectedColor : this._deselectedColor)
            .setChild(buttonBox);
        this._factionNsidNameToBorder[faction.nsidName] = border;

        return border;
    }

    _toggle(faction) {
        assert(typeof faction.nsidName === "string");
        const newIsSelectedValue = !this.isSelected(faction);
        this.setIsSelected(faction, newIsSelectedValue);
    }
}

module.exports = { ChooseFactionUi };
