const locale = require("../../lib/locale");
const {
    Border,
    Button,
    Rotator,
    UIElement,
    UIPresentationStyle,
    Vector,
    world,
} = require("../../wrapper/api");

let ui = undefined;

const initHandler = () => {
    console.log("screen-ui.end-turn.init");

    const endTurnButton = new Button().setText(locale("ui.button.end_turn"));
    endTurnButton.onClicked.add((button, clickingPlayer) => {
        console.log("XXX ONCLICKED");
    });

    ui = new UIElement();
    ui.position = new Vector(0, 0, 20);
    ui.rotation = new Rotator(0, 0, 0);
    ui.scale = 1;
    ui.width = 100;
    ui.height = 100;
    ui.useWidgetSize = false;
    ui.presentationStyle = UIPresentationStyle.Screen; // does not clip
    ui.widget = new Border().setChild(endTurnButton);

    console.log(
        `using presentation style ${ui.presentationStyle}, twoSided ${ui.twoSided}`
    );
    world.addUI(ui);
};

// globalEvents.onTick.add(() => {
//     let player = world.getAllPlayers()[0];
//     const p0 = player.getPosition();
//     const fwd = player.getRotation().getForwardVector();
//     const offset = new Vector(0, 0, 0.3);
//     ui.position = p0.add(fwd).add(offset);
//     world.updateUI(ui);
// });

//world.TI4.asyncTaskQueue.add(initHandler);
initHandler();
//initHandler();
