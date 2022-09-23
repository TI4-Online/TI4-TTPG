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

const PATH_FONT_SIIZE = CONFIG.fontSize * 0.9;
const PERIODIC_UPDATE_MSECS = 5000;

/**
 * Wrap Widgets inside a panet with top-row of tabs to select between them.
 */
class NavPanel extends LayoutBox {
    constructor() {
        super();

        this._currentNavEntry = undefined;
        this._periodicUpdateInterval = undefined;

        this._rootFolder = new NavFolder().setName(locale("nav.root"));

        // Path elements to the right of the root button.
        // Center rather than fill to use "natural" path entry button height.
        this._pathPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center);

        // Main contents for the current nav entry.
        this._currentNavEntryBox = new LayoutBox();

        // "Root" is a large button extending to the edge of path panel border.
        // The current path appears as clickable entries to the right.
        const rootButton = new Button()
            .setFontSize(PATH_FONT_SIIZE)
            .setText(" " + this._rootFolder.getName() + " ");
        rootButton.onClicked.add((button, player) => {
            this.setCurrentNavEntry(this._rootFolder);
        });

        // "Top" layout holding root button and path.
        const topPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(rootButton, 0)
            .addChild(this._pathPanel, 1);
        const topBox = new LayoutBox()
            .setOverrideHeight(PATH_FONT_SIIZE * 3)
            .setChild(topPanel);
        const topBorder = new Border()
            .setColor(ColorUtil.colorFromHex("#101010"))
            .setChild(topBox);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(topBorder, 0)
            .addChild(this._currentNavEntryBox, 1);

        this.setChild(panel);

        this.setCurrentNavEntry(this._rootFolder);
    }

    startPeriodicUpdates() {
        const handler = () => {
            if (this._currentNavEntry) {
                this._currentNavEntry.periodicUpdateWidget(
                    this._currentNavEntry
                );
            }
        };

        if (this._periodicUpdateInterval) {
            clearInterval(this._periodicUpdateInterval);
            this._periodicUpdateInterval = undefined;
        }
        this._periodicUpdateInterval = setInterval(
            handler,
            PERIODIC_UPDATE_MSECS
        );
        return this;
    }

    stopPeriodicUpdates() {
        if (this._periodicUpdateInterval) {
            clearInterval(this._periodicUpdateInterval);
            this._periodicUpdateInterval = undefined;
        }
        return this;
    }

    getRootFolder() {
        return this._rootFolder;
    }

    setCurrentNavEntry(navEntry) {
        assert(navEntry);

        if (this._currentNavEntry) {
            this._currentNavEntry.destroyWidget(this._currentNavEntry);
        }
        this._currentNavEntry = navEntry;

        // Get the path, stripping off the root entry (root is a dedicated button).
        const pathEntries = navEntry.getPath();
        if (pathEntries.length > 0 && pathEntries[0] == this._rootFolder) {
            pathEntries.shift();
        }

        // Update path.
        this._pathPanel.removeAllChildren();
        for (const pathEntry of pathEntries) {
            const sep = new Text().setFontSize(PATH_FONT_SIIZE).setText("/");
            this._pathPanel.addChild(sep, 0);

            const name = pathEntry.getName();
            const button = new Button()
                .setFontSize(PATH_FONT_SIIZE)
                .setText(name);
            button.onClicked.add((button, player) => {
                this.setCurrentNavEntry(pathEntry);
            });
            this._pathPanel.addChild(button, 0);
        }

        // Fill empty space between left and right entries.
        //this._pathPanel.addChild(new LayoutBox(), 1);

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
