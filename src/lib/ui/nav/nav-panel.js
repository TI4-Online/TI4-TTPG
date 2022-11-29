const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../../game-ui/game-ui-config");
const { ColorUtil } = require("../../color/color-util");
const { NavFolder } = require("./nav-folder");
const { WidgetFactory } = require("../widget-factory");
const { VerticalAlignment, Widget } = require("../../../wrapper/api");

const PATH_FONT_SIIZE = CONFIG.fontSize * 0.9;
const PERIODIC_UPDATE_MSECS = 5000;

/**
 * Wrap Widgets inside a panet with top-row of tabs to select between them.
 */
class NavPanel {
    constructor() {
        this._currentNavEntry = undefined;
        this._periodicUpdateInterval = undefined;

        this._rootFolder = new NavFolder().setName(locale("nav.root"));

        // Path elements to the right of the root button.
        this._pathBox = WidgetFactory.layoutBox();

        // Main contents for the current nav entry.
        this._currentNavEntryBox = WidgetFactory.layoutBox();

        // "Root" is a large button extending to the edge of path panel border.
        // The current path appears as clickable entries to the right.
        const rootButton = WidgetFactory.button()
            .setFontSize(PATH_FONT_SIIZE)
            .setText(" " + this._rootFolder.getName() + " ");
        rootButton.onClicked.add((clickedButton, player) => {
            this.setCurrentNavEntry(this._rootFolder);
        });

        // "Top" layout holding root button and path.
        const topPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(rootButton, 0)
            .addChild(this._pathBox, 1);
        const topBox = WidgetFactory.layoutBox()
            .setOverrideHeight(PATH_FONT_SIIZE * 3)
            .setChild(topPanel);
        const topBorder = WidgetFactory.border()
            .setColor(ColorUtil.colorFromHex("#101010"))
            .setChild(topBox);

        this._mainWidget = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(topBorder, 0)
            .addChild(this._currentNavEntryBox, 1);
    }

    getWidget() {
        return this._mainWidget;
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

        // If the current nav entry is already correct, keep it.
        if (this._currentNavEntry === navEntry) {
            return;
        }

        // Release the current entry.
        if (this._currentNavEntry) {
            this._currentNavEntry.destroyWidget(this._currentNavEntry);
            this._currentNavEntry = undefined;
        }

        // Get the path, stripping off the root entry (root is a dedicated button).
        const pathEntries = navEntry.getPath();
        if (pathEntries.length > 0 && pathEntries[0] == this._rootFolder) {
            pathEntries.shift();
        }

        // Update path.
        // Center rather than fill to use "natural" path entry button height.
        const pathPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center);
        for (const pathEntry of pathEntries) {
            const sep = WidgetFactory.text()
                .setFontSize(PATH_FONT_SIIZE)
                .setText("/");
            pathPanel.addChild(sep, 0);

            const name = pathEntry.getName();
            const button = WidgetFactory.button()
                .setFontSize(PATH_FONT_SIIZE)
                .setText(name);
            button.onClicked.add((clickedButton, player) => {
                this.setCurrentNavEntry(pathEntry);
            });
            pathPanel.addChild(button, 0);
        }

        const oldPathPanel = this._pathBox.getChild();
        if (oldPathPanel) {
            this._pathBox.setChild(undefined);
            WidgetFactory.release(oldPathPanel);
        }

        this._pathBox.setChild(pathPanel);

        // Fill empty space between left and right entries.
        //this._pathPanel.addChild(new LayoutBox(), 1);

        // Do we want search?
        // const searchButton = new Button()
        //     .setFontSize(pathFontSize)
        //     .setText("SEARCH");
        // this._pathPanel.addChild(searchButton);

        // If being reset to the current entry calling setChild with the
        // already-there entry is an error.  Set temporary widget and replace.
        // Not needed: keep the current entry in place.
        // this._currentNavEntryBox.setChild(new LayoutBox());

        // Release old main content.
        const oldMainWidget = this._currentNavEntryBox.getChild();
        if (
            oldMainWidget &&
            this._currentNavEntry &&
            !this._currentNavEntry.getPersistWidget()
        ) {
            this._currentNavEntryBox.setChild(undefined);
            WidgetFactory.release(oldMainWidget);
        }

        // Update main window.
        const widget = navEntry.createWidget(this);
        assert(widget && widget instanceof Widget);
        this._currentNavEntryBox.setChild(widget);

        // If we got this far (no erroring out), remember the entry.
        // This is useful because it prevents periodic updates from trying
        // to apply to a bad instance.
        this._currentNavEntry = navEntry;

        return this;
    }
}

module.exports = { NavPanel };
