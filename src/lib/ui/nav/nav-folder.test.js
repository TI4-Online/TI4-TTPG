const assert = require("assert");
const { NavEntry } = require("./nav-entry");
const { NavFolder } = require("./nav-folder");
const { NavPanel } = require("./nav-panel");
const { Widget } = require("../../../wrapper/api");

it("_createWidget", () => {
    const navPanel = new NavPanel();
    const rootFolder = navPanel.getRootFolder();
    const childFolder = new NavFolder();
    rootFolder.addChild(childFolder);

    // Root has no parent, and no "up" entry.
    let widget = NavFolder._createFolderContentsWidget(navPanel, rootFolder);
    assert(widget instanceof Widget);

    // Child has a parent, thus has "up" entry.
    widget = NavFolder._createFolderContentsWidget(navPanel, childFolder);
    assert(widget instanceof Widget);
});

it("getChildren", () => {
    const a = new NavFolder().setName("a");
    const b1 = new NavFolder().setName("b1");
    const b2 = new NavFolder().setName("b2");
    const c = new NavEntry().setName("c");
    const d = new NavEntry().setName("d");

    a.addChild(b1);
    a.addChild(b2);
    b1.addChild(c);
    b2.addChild(d);

    const textChildren = (navEntry) => {
        return navEntry
            .getChildren()
            .map((x) => x.getName())
            .join(",");
    };

    assert.equal(textChildren(a), "b1,b2");
    assert.equal(textChildren(b1), "c");
    assert.equal(textChildren(b2), "d");
});
