const assert = require("../../../wrapper/assert-wrapper");
const CONFIG = require("../../../game-ui/game-ui-config");
const { NavEntry } = require("./nav-entry");
const {
    Button,
    HorizontalAlignment,
    HorizontalBox,
    ImageButton,
    LayoutBox,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
} = require("../../../wrapper/api");

const DEFAULT_UP_ICON_PATH = "global/ui/icons/back.png";
const DEFAULT_FOLDER_ICON_PATH = "global/ui/icons/folder.png";
const MAX_CHILDREN_PER_ROW = 3;

const ICON_WIDTH = 70 * CONFIG.scale;
const ICON_HEIGHT = ICON_WIDTH;
const NAV_ENTRY_WIDTH = 235 * CONFIG.scale;
const NAV_SPACING = 20 * CONFIG.scale;

class NavFolder extends NavEntry {
    static _createEntryWidget(navPanel, navEntry, dstEntry) {
        assert(navPanel);
        assert(navEntry instanceof NavEntry);
        assert(dstEntry instanceof NavEntry);

        const onClickedHandler = (widget, player) => {
            navPanel.setCurrentNavEntry(dstEntry);
        };

        const icon = new ImageButton()
            .setImageSize(ICON_WIDTH, ICON_HEIGHT)
            .setImage(navEntry.getIconPath(), refPackageId);
        icon.onClicked.add(onClickedHandler);

        const name = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(` ${navEntry.getName()} `);
        name.onClicked.add(onClickedHandler);

        const panel = new VerticalBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Top)
            .addChild(icon)
            .addChild(name);

        const box = new LayoutBox()
            .setOverrideWidth(NAV_ENTRY_WIDTH)
            .setChild(panel);
        return box;
    }

    static _createFolderContentsWidget(navPanel, navFolder) {
        assert(navPanel);
        assert(navFolder instanceof NavFolder);

        const outerPanel = new VerticalBox().setChildDistance(NAV_SPACING);

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
                .setName("..up")
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
                innerPanel = new HorizontalBox()
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
