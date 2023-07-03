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

it("assertIsFactionArray", () => {
    let factionNsidNameArray = ["arborec"];
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsFactionArray(
        factionNsidNameArray,
        returnWarningInsteadOfThrow
    );

    factionNsidNameArray = "__does_not_exist__";
    assert.throws(() => {
        AbstractUtil.assertIsFactionArray(
            factionNsidNameArray,
            returnWarningInsteadOfThrow
        );
    });

    factionNsidNameArray = ["__does_not_exist__"];
    assert.throws(() => {
        AbstractUtil.assertIsFactionArray(
            factionNsidNameArray,
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

it("assertIsHexToTile", () => {
    let hexToTile = { "<0,0,0>": 18 };
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsHexToTile(hexToTile, returnWarningInsteadOfThrow);

    hexToTile = "__not_a_hex__";
    assert.throws(() => {
        AbstractUtil.assertIsHexToTile(hexToTile, returnWarningInsteadOfThrow);
    });

    hexToTile = { __not_a_hex__: 18 };
    assert.throws(() => {
        AbstractUtil.assertIsHexToTile(hexToTile, returnWarningInsteadOfThrow);
    });

    hexToTile = { "<0,0,0>": "__not_a_tile__" };
    assert.throws(() => {
        AbstractUtil.assertIsHexToTile(hexToTile, returnWarningInsteadOfThrow);
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

it("assertIsSliceArray", () => {
    let sliceArray = [[1, 2]];
    const shape = ["<0,0,0>", "<1,0,-1>", "<2,0,-2>"];
    const returnWarningInsteadOfThrow = false;
    AbstractUtil.assertIsSliceArray(
        sliceArray,
        shape,
        returnWarningInsteadOfThrow
    );

    sliceArray = "__not_a_slice__";
    assert.throws(() => {
        AbstractUtil.assertIsSliceArray(
            sliceArray,
            shape,
            returnWarningInsteadOfThrow
        );
    });

    sliceArray = [[1, 2, 3]]; // too many tile numbers for shape (first is HS)
    assert.throws(() => {
        AbstractUtil.assertIsSliceArray(
            sliceArray,
            shape,
            returnWarningInsteadOfThrow
        );
    });
});
