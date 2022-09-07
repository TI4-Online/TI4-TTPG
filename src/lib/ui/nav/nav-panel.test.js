const assert = require("assert");
const { NavEntry } = require("./nav-entry");
const { NavFolder } = require("./nav-folder");
const { NavPanel } = require("./nav-panel");
const { MockWidget } = require("../../../wrapper/api");

it("constructor", () => {
    new NavPanel();
});

it("getRootFolder", () => {
    const navPanel = new NavPanel();
    const root = navPanel.getRootFolder();
    assert(root instanceof NavFolder);
    assert.equal(root.getParentNavEntry(), undefined);
});

it("setCurrentNavEntry", () => {
    let factoryCalls = 0;
    const factory = (navPanel, navEntry) => {
        assert(navPanel instanceof NavPanel);
        assert(navEntry instanceof NavEntry);
        factoryCalls += 1;
        return new MockWidget();
    };

    const navPanel = new NavPanel();
    const navEntry = new NavEntry().setWidgetFactory(factory);

    assert.equal(factoryCalls, 0);
    navPanel.setCurrentNavEntry(navEntry);
    assert.equal(factoryCalls, 1);
});
