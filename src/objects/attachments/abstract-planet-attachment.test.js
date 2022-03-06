require("../../global"); // register world.TI4
const assert = require("assert");
const { AbstractPlanetAttachment } = require("./abstract-planet-attachment");
const { MockGameObject, globalEvents, world } = require("../../wrapper/api");

it("constructor", () => {
    const gameObject = new MockGameObject();
    const attrs = {};
    const localeName = "n/a";
    new AbstractPlanetAttachment(gameObject, attrs, localeName);
});
