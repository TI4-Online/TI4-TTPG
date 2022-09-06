const assert = require("assert");
const { NavEntry } = require("./nav-entry");
const { NavFolder } = require("./nav-folder");
const { NavPanel } = require("./nav-panel");
const { MockWidget } = require("../../../wrapper/api");

it("get/set name", () => {
    const navEntry = new NavEntry();
    assert.equal(navEntry.getName(), undefined);
    navEntry.setName("foo");
    assert.equal(navEntry.getName(), "foo");
});

it("get/set desc", () => {
    const navEntry = new NavEntry();
    assert.equal(navEntry.getDescription(), undefined);
    navEntry.setDescription("bar");
    assert.equal(navEntry.getDescription(), "bar");
});

it("get/set icon", () => {
    const navEntry = new NavEntry();
    assert.equal(navEntry.getIconPath(), undefined);
    navEntry.setIconPath("baz");
    assert.equal(navEntry.getIconPath(), "baz");
});

it("getPath", () => {
    const a = new NavFolder().setName("a");
    const b1 = new NavFolder().setName("b1");
    const b2 = new NavFolder().setName("b2");
    const c = new NavEntry().setName("c");
    const d = new NavEntry().setName("d");

    a.addChild(b1);
    a.addChild(b2);
    b1.addChild(c);
    b2.addChild(d);

    const textPath = (navEntry) => {
        return navEntry
            .getPath()
            .map((x) => x.getName())
            .join("/");
    };

    assert.equal(textPath(a), "a");
    assert.equal(textPath(b1), "a/b1");
    assert.equal(textPath(b2), "a/b2");
    assert.equal(textPath(c), "a/b1/c");
    assert.equal(textPath(d), "a/b2/d");
});

it("getParentNavEntry", () => {
    const a = new NavFolder().setName("a");
    const b1 = new NavFolder().setName("b1");
    const b2 = new NavFolder().setName("b2");
    const c = new NavEntry().setName("c");
    const d = new NavEntry().setName("d");

    a.addChild(b1);
    a.addChild(b2);
    b1.addChild(c);
    b2.addChild(d);

    const textParent = (navEntry) => {
        return navEntry.getParentNavEntry().getName();
    };

    assert.equal(textParent(b1), "a");
    assert.equal(textParent(b2), "a");
    assert.equal(textParent(c), "b1");
    assert.equal(textParent(d), "b2");
});

it("widget factory", () => {
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
    const widget = navEntry.createWidget(navPanel);
    assert(widget instanceof MockWidget);
    assert.equal(factoryCalls, 1);
});
