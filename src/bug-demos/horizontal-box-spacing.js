const {
    Border,
    Text,
    UIElement,
    Vector,
    world,
    HorizontalBox,
} = require("@tabletop-playground/api");

{
    const ui = new UIElement();
    ui.position = new Vector(0, 0, world.getTableHeight() + 4);
    ui.widget = new Border().setColor([1, 0, 0]).setChild(
        new HorizontalBox()
            .setChildDistance(20)
            .addChild(new Border().setChild(new Text().setText("A")))
            .addChild(new Border().setChild(new Text().setText("B")))
    );
    world.addUI(ui);
}
