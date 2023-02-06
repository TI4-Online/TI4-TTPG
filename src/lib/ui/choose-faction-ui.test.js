require("../../global"); // register world.TI4
const assert = require("assert");
const { ChooseFactionUi } = require("./choose-faction-ui");
const { Widget, world } = require("../../wrapper/api");

it("getOrderedFactions", () => {
    const factions = ChooseFactionUi.getOrderedFactions();
    const factionAbbrs = factions.map((x) => x.nameAbbr);
    assert.deepEqual(factionAbbrs, [
        "Arborec",
        "Argent",
        "Creuss",
        "Empyrean",
        "Hacan",
        "Jol-Nar",
        "Keleres - Argent",
        "Keleres - Mentak",
        "Keleres - Xxcha",
        "L1Z1X",
        "Letnev",
        "Mahact",
        "Mentak",
        "Muaat",
        "N'orr",
        "Naalu",
        "Naaz-Rokha",
        "Nekro",
        "Nomad",
        "Saar",
        "Sol",
        "Ul",
        "Vuil'raith",
        "Winnu",
        "Xxcha",
        "Yin",
        "Yssaril",
    ]);
});

it("constructor / getWidget", () => {
    const chooseFactionUi = new ChooseFactionUi();
    const widget = chooseFactionUi.getWidget();
    assert(widget instanceof Widget);
});

it("initial selection(s)", () => {
    const chooseFactionUi = new ChooseFactionUi();
    const arborec = world.TI4.getFactionByNsidName("arborec");
    const muaat = world.TI4.getFactionByNsidName("muaat");
    assert(arborec && muaat);

    // Initial.
    let arborecSelected = chooseFactionUi.isSelected(arborec);
    let muaatSelected = chooseFactionUi.isSelected(muaat);
    let selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, false);
    assert.equal(muaatSelected, false);
    assert.deepEqual(selected.length, 0);
});

it("select single", () => {
    const chooseFactionUi = new ChooseFactionUi();
    const arborec = world.TI4.getFactionByNsidName("arborec");
    const muaat = world.TI4.getFactionByNsidName("muaat");
    assert(arborec && muaat);

    // Initial.
    let arborecSelected = chooseFactionUi.isSelected(arborec);
    let muaatSelected = chooseFactionUi.isSelected(muaat);
    let selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, false);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 0);

    // Select one.
    chooseFactionUi.setIsSelected(arborec, true);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, true);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].nameAbbr, "Arborec");

    // Select different.
    chooseFactionUi.setIsSelected(muaat, true);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, false);
    assert.equal(muaatSelected, true);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].nameAbbr, "Muaat");

    // Deselect.
    chooseFactionUi.setIsSelected(muaat, false);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, false);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 0);
});

it("select multiple", () => {
    const chooseFactionUi = new ChooseFactionUi().setAllowSelectMultiple(true);
    const arborec = world.TI4.getFactionByNsidName("arborec");
    const muaat = world.TI4.getFactionByNsidName("muaat");
    assert(arborec && muaat);

    // Initial.
    let arborecSelected = chooseFactionUi.isSelected(arborec);
    let muaatSelected = chooseFactionUi.isSelected(muaat);
    let selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, false);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 0);

    // Select one.
    chooseFactionUi.setIsSelected(arborec, true);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, true);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].nameAbbr, "Arborec");

    // Select different.
    chooseFactionUi.setIsSelected(muaat, true);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, true);
    assert.equal(muaatSelected, true);
    assert.equal(selected.length, 2);
    assert.equal(selected[0].nameAbbr, "Arborec");
    assert.equal(selected[1].nameAbbr, "Muaat");

    // Deselect.
    chooseFactionUi.setIsSelected(muaat, false);

    arborecSelected = chooseFactionUi.isSelected(arborec);
    muaatSelected = chooseFactionUi.isSelected(muaat);
    selected = chooseFactionUi.getSelectedFactions();
    assert.equal(arborecSelected, true);
    assert.equal(muaatSelected, false);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].nameAbbr, "Arborec");
});

it("callback", () => {
    const chooseFactionUi = new ChooseFactionUi().setAllowSelectMultiple(true);
    const arborec = world.TI4.getFactionByNsidName("arborec");

    let numCallbacks = 0;
    const callback = () => {
        numCallbacks += 1;
    };
    chooseFactionUi.onFactionStateChanged.add(callback);

    // No callbacks yet.
    assert.equal(numCallbacks, 0);

    chooseFactionUi.setIsSelected(arborec, true);

    // Callback.
    assert.equal(numCallbacks, 1);
});
