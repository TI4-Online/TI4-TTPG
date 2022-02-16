const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const {
    Button,
    Canvas,
    Color,
    HorizontalBox,
    ImageWidget,
    Text,
    VerticalBox,
    refObject,
} = require("../../wrapper/api");
const { Technology } = require("../../lib/technology/technology");
const locale = require("../../lib/locale");


const TechIcons = {
    Red: new Color(1, 0, 0),
    Yellow: new Color(1, 1, 0),
    Green: new Color(0, 1, 0),
    Blue: new Color(0, 0, 1)
}

function widgetFactory(playerDesk) {
    let canvas = new Canvas();

    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.technology.text"));
    canvas.addChild(headerText, 0, 0, 200, 35);

    const technologies = Technology.getTechnologiesByType(playerDesk.playerSlot);
    let canvasX = 0;
    let maxY = 0;
    ["Blue", "Red", "Yellow", "Green"].forEach(type => {
        let canvasY = 50;
        technologies[type].forEach(tech => {
            let techButton = new Button().setText(tech.name).setTextColor(TechIcons[type]);
            canvas.addChild(techButton, canvasX, canvasY, 200, 35);

            if (Object.keys(tech.requirements).length > 0) {
                canvasY += 20;
                for (let requirement in tech.requirements) {
                    for (let i = 0 ; i < tech.requirements[requirement] ; i++) {
                        //let techIcon = new ImageWidget().setImage();
                        // TODO replace by tech icon image
                        let techIcon = new Text().setText("X").setTextColor(TechIcons[requirement]);
                        canvas.addChild(techIcon, canvasX + 15*i, canvasY + 12, 200, 35);
                    }
                }
            }
            canvasY += 40;
        });
        maxY = Math.max(canvasY, maxY);
        canvasX += 210;
    });

    technologies.unitUpgrade.forEach((unitUpgrade, index) => {
        let techButton = new Button().setText(unitUpgrade.name);
        const xOffset = (index % 4) * 210;
        const yOffset = maxY + 20 + Math.floor(index/4) * 60;
        canvas.addChild(techButton, xOffset, yOffset, 200, 35);

        let iconOffset = 0;
        if (Object.keys(unitUpgrade.requirements).length > 0) {
            for (let requirement in unitUpgrade.requirements) {
                for (let i = 0 ; i < unitUpgrade.requirements[requirement] ; i++) {
                    //let techIcon = new ImageWidget().setImage();
                    // TODO replace by tech icon image
                    let techIcon = new Text().setText("X").setTextColor(TechIcons[requirement]);
                    canvas.addChild(techIcon, xOffset + iconOffset, yOffset + 32, 200, 35);
                    iconOffset += 15;
                }
            }
        }
    });


    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.close"));
    closeButton.onClicked.add(onUiClosedClicked);
    canvas.addChild(closeButton, 0, 570, 846, 48);

    return canvas;
}

const calculateHeight = (playerSlot => {
    const technologies = Technology.getTechnologiesByType(playerSlot);
    const techRows = ["Blue", "Red", "Yellow", "Green"]
        .map(type => technologies[type].length)
        .reduce((a,b) => Math.max(a,b));
    const unitUpgradeRows = Math.ceil(technologies.unitUpgrade.length / 4);
    return (techRows + unitUpgradeRows) * 60 + 100;
});

//const onStrategyCardPlayed = (card, player) => {};

//const onStrategyCardSelectionDone = (card, player) => {};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(calculateHeight)
    .setWidth(845)
    .setColor(new Color(0.027, 0.203, 0.466))
    //.setOnStrategyCardPlayed(onStrategyCardPlayed)
    //.setOnStrategyCardSelectionDone(onStrategyCardSelectionDone)
    .register();
