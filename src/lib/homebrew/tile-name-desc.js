const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const {
    GameObject,
    LayoutBox,
    Player,
    RichText,
    UIElement,
    UIZoomVisibility,
    VerticalAlignment,
    VerticalBox,
    refObject,
    refPackageId,
    world,
} = require("../../wrapper/api");

const SCALE = 8;
const DESC_LINE_CHARS = 40;
const ACTION_NAME = "*" + locale("action.update");

let _nameText = undefined;
let _descText = undefined;

function updateNameDescUI() {
    if (!_nameText) {
        _nameText = new RichText()
            .setAutoWrap(true)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(2.5 * SCALE)
            .setTextColor([1, 1, 1, 1]);
        _descText = new RichText()
            .setAutoWrap(true)
            .setFont("myriad-pro-semibold.ttf", refPackageId)
            .setFontSize(2.5 * SCALE)
            .setTextColor([1, 1, 1, 1]);

        const descIndent = new LayoutBox()
            .setPadding(2 * SCALE, 0, 0, 0)
            .setChild(_descText);

        const panel = new VerticalBox()
            .addChild(_nameText)
            .addChild(descIndent);

        // getExtent fails if the object is inside a container.  Hard code for now.
        //const extent = refObject.getExtent();
        const extent = {
            x: 2.1,
            y: 3.15,
            z: 0.1,
        };
        const padH = 5;
        const padV = 4;
        const box = new LayoutBox()
            .setOverrideWidth(Math.floor(extent.y * 20 * SCALE - padH * SCALE))
            .setMinimumHeight(Math.floor(extent.x * 20 * SCALE - padV * SCALE))
            .setVerticalAlignment(VerticalAlignment.Top)
            .setChild(panel);

        const z = extent.z + 0.01;
        const ui = new UIElement();
        ui.position = [0, 0, z];
        ui.scale = 1 / SCALE;
        ui.widget = box;
        ui.zoomVisibility = UIZoomVisibility.Both;
        refObject.addUI(ui);

        // Expose the update method for scripts to invoke.
        refObject.__updateNameDescUI = updateNameDescUI;
    }

    // If the description has newlines leave it alone.
    const origDesc = refObject.getDescription();
    const rewrapDesc = origDesc.indexOf("\n") < 0;
    if (rewrapDesc) {
        const words = refObject
            .getDescription()
            .replace(/\n/g, " ")
            .split(" ")
            .filter((word) => word.length > 0);
        const lines = [""];
        for (const word of words) {
            let line = lines.pop();
            if (line.length + word.length + 1 <= DESC_LINE_CHARS) {
                line += " " + word;
                lines.push(line);
            } else {
                line += "\n";
                lines.push(line);
                line = word;
                lines.push(line);
            }
        }
        const desc = lines.join("");
        refObject.setDescription(desc);
    }

    const name = refObject.getName().toUpperCase(); // UPPER
    const desc = origDesc; // Use newlines if originally there
    _nameText.setText(name);
    _descText.setText(desc);
}

refObject.addCustomAction(ACTION_NAME);

refObject.onCustomAction.add((obj, player, actionName) => {
    assert(obj instanceof GameObject);
    assert(player instanceof Player);
    assert(typeof actionName === "string");

    if (actionName === ACTION_NAME) {
        updateNameDescUI();
    }
});

refObject.onCreated.add((obj) => {
    // Wait a tick so the creator can set the name and description.
    process.nextTick(() => {
        updateNameDescUI();
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    updateNameDescUI();
}
