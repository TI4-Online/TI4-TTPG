require("../../../global");
const assert = require("assert");
const { AbstractUtil } = require("./abstract-util");

it("assertIsDeskIndex", () => {
    let deskIndex = 0;
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsDeskIndex(deskIndex, returnWarningInsteadOfThrow);

    deskIndex = -1;
    assert.throws(() => {
        AbstractUtil.assertIsDeskIndex(deskIndex, returnWarningInsteadOfThrow);
    });
});

it("assertIsFaction", () => {
    let factionNsidName = "arborec";
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsFaction(factionNsidName, returnWarningInsteadOfThrow);

    factionNsidName = "__does_not_exist__";
    assert.throws(() => {
        AbstractUtil.assertIsFaction(
            factionNsidName,
            returnWarningInsteadOfThrow
        );
    });
});

it("assertIsHex", () => {
    let hex = "<0,0,0>";
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsHex(hex, returnWarningInsteadOfThrow);

    hex = "__not_a_hex__";
    assert.throws(() => {
        AbstractUtil.assertIsHex(hex, returnWarningInsteadOfThrow);
    });
});

it("assertIsMapString", () => {
    let mapString = "1 2 3";
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsMapString(mapString, returnWarningInsteadOfThrow);

    mapString = "foobar";
    assert.throws(() => {
        AbstractUtil.assertIsMapString(mapString, returnWarningInsteadOfThrow);
    });
});

it("assertIsShape", () => {
    let shape = ["<0,0,0>", "<1,0,-1>", "<2,0,-2>"];
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsShape(shape, returnWarningInsteadOfThrow);

    shape = "__not_a_shape__";
    assert.throws(() => {
        AbstractUtil.assertIsShape(shape, returnWarningInsteadOfThrow);
    });

    shape = ["__not_a_hex__"];
    assert.throws(() => {
        AbstractUtil.assertIsShape(shape, returnWarningInsteadOfThrow);
    });
});

it("assertIsSlice", () => {
    let slice = [1, 2];
    const shape = ["<0,0,0>", "<1,0,-1>", "<2,0,-2>"];
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsSlice(slice, shape, returnWarningInsteadOfThrow);

    slice = "__not_a_slice__";
    assert.throws(() => {
        AbstractUtil.assertIsSlice(slice, shape, returnWarningInsteadOfThrow);
    });

    slice = [1, 2, 3]; // too many tile numbers for shape (first is HS)
    assert.throws(() => {
        AbstractUtil.assertIsSlice(slice, shape, returnWarningInsteadOfThrow);
    });
});
