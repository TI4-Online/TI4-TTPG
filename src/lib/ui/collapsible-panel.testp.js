const { CollapsiblePanel } = require("./collapsible-panel");
const { Text, Rotator, Vector, world } = require("../../wrapper/api");

const scale = 2;

const child = new Text().setText("lorem\ntest\ntest").setFontSize(10 * scale);

const collapsiblePanel = new CollapsiblePanel()
    .setChild(child)
    .setClosable(false)
    .setColor([1, 0, 0, 1])
    .setTitle("foo")
    .setScale(scale);

const pos = new Vector(0, 0, 2);
const rot = new Rotator(35, 0, 0);
const playerDesk = world.TI4.getAllPlayerDesks()[0];

collapsiblePanel.createAndAddUi(pos, rot, playerDesk);
