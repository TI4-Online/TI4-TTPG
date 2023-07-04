const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../../game-ui/game-ui-config");
const { NavEntry } = require("./nav-entry");
const { WidgetFactory } = require("../widget-factory");
const {
    HorizontalAlignment,
    VerticalAlignment,
    refPackageId,
} = require("../../../wrapper/api");

const DEFAULT_UP_ICON_PATH = "global/ui/icons/back.png";
const DEFAULT_FOLDER_ICON_PATH = "global/ui/icons/folder.png";
const MAX_CHILDREN_PER_ROW = 3;

const ICON_WIDTH = 70 * CONFIG.scale;
const ICON_HEIGHT = ICON_WIDTH;
const NAV_ENTRY_WIDTH = 240 * CONFIG.scale;
const NAV_ENTRY_PAD_V = 12 * CONFIG.scale;
const NAV_SPACING = 10 * CONFIG.scale;
const NAV_ENTRY_FONTSIZE = CONFIG.fontSize * 0.9;

class NavFolder extends NavEntry {
    static _createEntryWidget(navPanel, navEntry, dstEntry) {
        assert(navPanel);
        assert(navEntry instanceof NavEntry);
        assert(dstEntry instanceof NavEntry);

        const onClickedHandler = (widget, player) => {
            navPanel.setCurrentNavEntry(dstEntry);
        };

        const icon = WidgetFactory.imageWidget()
            .setImageSize(ICON_WIDTH, ICON_HEIGHT)
            .setImage(navEntry.getIconPath(), navEntry.getIconPackageId());

        const name = WidgetFactory.text()
            .setFontSize(NAV_ENTRY_FONTSIZE)
            .setText(` ${navEntry.getName()} `);

        const panel = WidgetFactory.verticalBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(icon)
            .addChild(name);

        const box = WidgetFactory.layoutBox()
            .setOverrideWidth(NAV_ENTRY_WIDTH)
            .setPadding(0, 0, NAV_ENTRY_PAD_V, NAV_ENTRY_PAD_V)
            .setChild(panel);

        const contentButton = WidgetFactory.contentButton().setChild(box);
        contentButton.onClicked.add(onClickedHandler);

        return contentButton;
    }

    static _createFolderContentsWidget(navPanel, navFolder) {
        assert(navPanel);
        assert(navFolder instanceof NavFolder);

        const outerPanel =
            WidgetFactory.verticalBox().setChildDistance(NAV_SPACING);

        // Get a mutable copy, we may prepend "up".
        const children = [...navFolder.getChildren()];

        // Sort before prepend.
        children.sort((a, b) => {
            a = a.getName();
            b = b.getName();
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });

        // If entry has a parent, create "up" option.
        const parent = navFolder.getParentNavEntry();
        if (parent) {
            const up = new NavEntry()
                .setName(locale("nav.up"))
                .setIconPath(DEFAULT_UP_ICON_PATH)
                .setWidgetFactory(parent.getWidgetFactory());
            up.__isUp = true;
            children.unshift(up);
        }

        // Grid layout, row major.
        let innerPanel = undefined;
        for (const childEntry of children) {
            const dstEntry = childEntry.__isUp ? parent : childEntry;
            const widget = NavFolder._createEntryWidget(
                navPanel,
                childEntry,
                dstEntry
            );
            if (
                !innerPanel ||
                innerPanel.getChildAt(MAX_CHILDREN_PER_ROW - 1)
            ) {
                innerPanel = WidgetFactory.horizontalBox()
                    .setChildDistance(NAV_SPACING)
                    .setHorizontalAlignment(HorizontalAlignment.Left);
                outerPanel.addChild(innerPanel);
            }
            innerPanel.addChild(widget);
        }

        return outerPanel;
    }

    constructor() {
        super();

        this.setIconPath(DEFAULT_FOLDER_ICON_PATH);
        this.setWidgetFactory(NavFolder._createFolderContentsWidget);
    }

    getChildren() {
        return this._children || [];
    }

    addChild(childNavEntry) {
        assert(childNavEntry instanceof NavEntry);
        assert(!childNavEntry._parentNavEntry); // can only be added to one parent
        childNavEntry._parentNavEntry = this;
        if (!this._children) {
            this._children = [];
        }
        this._children.push(childNavEntry);
        return this;
    }
}

module.exports = { NavFolder };
