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

        // For entries that want to keep state when returning to them.
        // This *does* keep the object in memory, so be careful!
        this._persistWidget = false;
        this._persistedWidget = undefined;

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

        // Owner can ask widget to keep UI around across leave/return.
        let widget = undefined;
        if (this._persistWidget) {
            widget = this._persistedWidget;
        }
        if (!widget) {
            widget = this._widgetFactory(navPanel, this);
            assert(widget);
            assert(widget instanceof Widget);
        }
        if (this._persistWidget) {
            this._persistedWidget = widget;
        }

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

    /**
     * Normally widgets get discarded when changing nav entries.
     * This tells this entry to keep the widget, and restore it
     * if/when returning to this entry.
     *
     * @param {boolean} value
     * @returns {NavEntry} self, for chaining
     */
    setPersistWidget(value) {
        assert(typeof value === "boolean");
        this._persistWidget = value;
        return this;
    }

    getPersistWidget() {
        return this._persistWidget;
    }
}

module.exports = { NavEntry, DEFAULT_ENTRY_ICON_PATH };
