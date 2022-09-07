const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../../game-ui/game-ui-config");
const { ColorUtil } = require("../../color/color-util");
const { NavFolder } = require("./nav-folder");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    VerticalAlignment,
    VerticalBox,
    Widget,
} = require("../../../wrapper/api");

/**
 * Wrap Widgets inside a panet with top-row of tabs to select between them.
 */
class NavPanel extends LayoutBox {
    constructor() {
        super();

        this._rootFolder = new NavFolder().setName(locale("nav.root"));

        this._pathPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center);
        this._currentNavEntryBox = new LayoutBox();

        // Padding between path and content.
        const pathBox = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(this._pathPanel);
        const pathBorder = new Border()
            .setColor(ColorUtil.colorFromHex("#101010"))
            .setChild(pathBox);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(pathBorder, 0)
            .addChild(this._currentNavEntryBox, 1);
        this.setChild(panel);

        this.setCurrentNavEntry(this._rootFolder);
    }

    getRootFolder() {
        return this._rootFolder;
    }

    setCurrentNavEntry(navEntry) {
        assert(navEntry);

        // Update path window.
        this._pathPanel.removeAllChildren();

        // Add path.
        const pathFontSize = CONFIG.fontSize * 0.9;
        let isFirst = true;
        for (const pathEntry of navEntry.getPath()) {
            if (isFirst) {
                isFirst = false;
            } else {
                const sep = new Text().setFontSize(pathFontSize).setText("/");
                this._pathPanel.addChild(sep, 0);
            }

            const name = pathEntry.getName();
            const button = new Button().setFontSize(pathFontSize).setText(name);
            button.onClicked.add((button, player) => {
                this.setCurrentNavEntry(pathEntry);
            });
            this._pathPanel.addChild(button, 0);
        }

        // Fill empty space between left and right entries.
        this._pathPanel.addChild(new LayoutBox(), 1);

        // Do we want search?
        // const searchButton = new Button()
        //     .setFontSize(pathFontSize)
        //     .setText("SEARCH");
        // this._pathPanel.addChild(searchButton);

        // If being reset to the current entry calling setChild with the
        // already-there entry is an error.  Set temporary widget and replace.
        this._currentNavEntryBox.setChild(new LayoutBox());

        // Update main window.
        const widget = navEntry.createWidget(this);
        assert(widget && widget instanceof Widget);
        this._currentNavEntryBox.setChild(widget);

        return this;
    }
}

module.exports = { NavPanel };
