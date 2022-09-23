const assert = require("../../../wrapper/assert-wrapper");
const { Widget } = require("../../../wrapper/api");

const DEFAULT_ENTRY_ICON_PATH = "global/ui/icons/document.png";

/**
 * An item in the navigation hierarchy.
 *
 * Mimics a file system: can have a single parent, and multiple children.
 */
class NavEntry {
    constructor() {
        this._name = undefined;
        this._description = undefined;
        this._iconPath = DEFAULT_ENTRY_ICON_PATH;
        this._widgetFactory = undefined;
        this._periodicUpdateWidget = undefined;
        this._destroyWidget = undefined;

        this._parentNavEntry = undefined;
        this._children = undefined;
    }

    getName() {
        return this._name;
    }

    getDescription() {
        return this._description;
    }

    getIconPath() {
        return this._iconPath;
    }

    getWidgetFactory() {
        return this._widgetFactory;
    }

    getParentNavEntry() {
        return this._parentNavEntry;
    }

    getPath() {
        const path = [];
        let iter = this;
        while (iter) {
            assert(iter instanceof NavEntry);
            path.unshift(iter);
            iter = iter._parentNavEntry;
        }
        return path;
    }

    createWidget(navPanel) {
        assert.equal(navPanel.constructor.name, "NavPanel");
        assert(this._widgetFactory);
        const widget = this._widgetFactory(navPanel, this);
        assert(widget);
        assert(widget instanceof Widget);
        return widget;
    }

    periodicUpdateWidget() {
        if (this._periodicUpdateWidget) {
            this._periodicUpdateWidget(this);
        }
    }

    destroyWidget() {
        if (this._destroyWidget) {
            this._destroyWidget(this);
        }
    }

    /**
     * Name displayed when showing this entry in a folder.
     *
     * @param {string} name
     * @returns {NavEntry} self, for chaining
     */
    setName(name) {
        assert(typeof name === "string");
        this._name = name;
        return this;
    }

    setDescription(description) {
        assert(typeof description === "string");
        this._description = description;
        return this;
    }

    setIconPath(path) {
        assert(typeof path === "string");
        this._iconPath = path;
        return this;
    }

    setWidgetFactory(widgetFactory) {
        assert(typeof widgetFactory === "function");
        this._widgetFactory = widgetFactory;
        return this;
    }

    setPeriodicUpdateWidget(periodicUpdateWidget) {
        assert(typeof periodicUpdateWidget === "function");
        this._periodicUpdateWidget = periodicUpdateWidget;
        return this;
    }

    setDestroyWidget(destroyWidget) {
        assert(typeof destroyWidget === "function");
        this._destroyWidget = destroyWidget;
        return this;
    }
}

module.exports = { NavEntry, DEFAULT_ENTRY_ICON_PATH };
