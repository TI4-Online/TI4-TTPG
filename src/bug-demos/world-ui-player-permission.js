const {
    Border,
    PlayerPermission,
    Text,
    UIElement,
    Vector,
    world,
} = require("@tabletop-playground/api");

for (let playerSlot = 0; playerSlot < 5; playerSlot++) {
    const playerPermission = new PlayerPermission();
    playerPermission.setPlayerSlots([playerSlot]);
    //playerPermission.setHost(true);

    const ui = new UIElement();
    ui.position = new Vector(playerSlot * 5, 0, world.getTableHeight() + 1);
    ui.widget = new Border().setChild(new Text().setText(`Only ${playerSlot}`));
    ui.players = playerPermission;
    world.addUI(ui);
}

const currentSlots = world
    .getAllPlayers()
    .map((x) => x.getSlot())
    .join(", ");
console.log(`current slots: ${currentSlots}`);
