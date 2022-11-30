const {
    Button,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("@tabletop-playground/api");

function assert(value) {
    if (!value) {
        throw new Error("assert");
    }
}

const panel = new VerticalBox();
const ui = new UIElement();
ui.position = new Vector(0, 0, world.getTableHeight() + 5);
ui.widget = panel;
world.addUI(ui);

const STEPS = [
    () => {
        // Create and add the button.  JavaScript proxy object "button" is
        // only defined in this scope, can be garabe collected after even
        // though the button got added to the panel UI.
        const button = new Button().setText("my button").setFontSize(40);
        button._hasJavascriptState = true;
        button.onClicked.add((clickedButton, player) => {
            console.log("first");
        });
        panel.addChild(button);
    },
    () => {
        gc();
    },
    () => {
        // Verify the button no longer has the extra field not regenerated
        // when creating a new proxy object.
        const button = panel.getChildAt(0);
        assert(button instanceof Button);
        assert(button.getText() === "my button"); // proxy recreates
        assert(!button._hasJavascriptState); // proxy not aware of this field

        button.onClicked.clear();
        button.onClicked.add((clickedButton, player) => {
            console.log("second");
        });
    },
];

// Spread out over several frames, gc needs a frame to run.
function doNext() {
    const step = STEPS.shift();
    if (step) {
        step();
        process.nextTick(doNext);
    } else {
        console.log("done");
    }
}
doNext();
