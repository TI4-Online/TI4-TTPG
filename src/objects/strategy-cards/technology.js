const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const {
    Button,
    Canvas,
    Color,
    ImageWidget,
    Text,
    refObject,
} = require("../../wrapper/api");
const { Technology } = require("../../lib/technology/technology");
const locale = require("../../lib/locale");

const imageSize = 30;

const techIcons = {
    unitUpgrade: {
        color: new Color(1, 1, 1),
    },
    Red: {
        color: new Color(1, 0, 0),
        activeIcon:
            "global/technology/warfare_tech_icon.png",
        disabledIcon:
            "global/technology/warfare_tech_disabled_icon.png",
    },
    Yellow: {
        color: new Color(1, 1, 0),
        activeIcon:
            "global/technology/cybernetic_tech_icon.png",
        disabledIcon:
            "global/technology/cybernetic_tech_disabled_icon.png",
    },
    Green: {
        color: new Color(0, 1, 0),
        activeIcon:
            "global/technology/biotic_tech_icon.png",
        disabledIcon:
            "global/technology/biotic_tech_disabled_icon.png",
    },
    Blue: {
        color: new Color(0, 0, 1),
        activeIcon:
            "global/technology/propulsion_tech_icon.png",
        disabledIcon:
            "global/technology/propulsion_tech_disabled_icon.png",
    },
};

function drawTechButton(canvas, xOffset, yOffset, tech, playerTechnologies, packageId) {
    let techButton = new Button()
        .setText(tech.name)
        .setTextColor(techIcons[tech.type].color);
    canvas.addChild(techButton, xOffset, yOffset, 200, 35);

    let numOfIcons = 0;

    if (Object.keys(tech.requirements).length > 0) {
        for (let requirement in tech.requirements) {
            for (let i = 0; i < tech.requirements[requirement]; i++) {
                const image =
                    playerTechnologies[requirement] > i
                        ? techIcons[requirement].activeIcon
                        : techIcons[requirement].disabledIcon;
                let techIcon = new ImageWidget()
                    .setImage(image, packageId)
                    .setImageSize(imageSize, imageSize);
                canvas.addChild(
                    techIcon,
                    xOffset + 15 * numOfIcons,
                    yOffset + 27,
                    imageSize,
                    imageSize
                );
                numOfIcons++;
            }
        }
    }
}

function widgetFactory(playerDesk, packageId) {
    let canvas = new Canvas();

    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.technology.text"));
    canvas.addChild(headerText, 0, 0, 200, 35);

    const playerTechnologies = {
        Blue: 0,
        Red: 1,
        Yellow: 2,
        Green: 3,
    };

    const technologies = Technology.getTechnologiesByType(
        playerDesk.playerSlot
    );

    let canvasX = 0;
    let maxY = 0;
    ["Blue", "Red", "Yellow", "Green"].forEach((type) => {
        let canvasY = 50;

        technologies[type].forEach((tech) => {
            drawTechButton(canvas, canvasX, canvasY, tech, playerTechnologies, packageId);
            canvasY += Object.keys(tech.requirements).length > 0 ? 55 : 40;
        });
        maxY = Math.max(canvasY, maxY);
        canvasX += 210;
    });

    technologies.unitUpgrade.forEach((tech, index) => {
        let techButton = new Button().setText(tech.name);
        const xOffset = (index % 4) * 210;
        const yOffset = maxY + 30 + Math.floor(index / 4) * 55;
        canvas.addChild(techButton, xOffset, yOffset, 200, 35);

        drawTechButton(canvas, xOffset, yOffset, tech, playerTechnologies, packageId);
    });

    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.close"));
    closeButton.onClicked.add(onUiClosedClicked);
    canvas.addChild(closeButton, 0, calculateHeight(playerDesk.playerSlot) - 45, 838, 48);

    return canvas;
}

const calculateHeight = (playerSlot) => {
    const technologies = Technology.getTechnologiesByType(playerSlot);
    const techRows = ["Blue", "Red", "Yellow", "Green"]
        .map((type) => technologies[type].length)
        .reduce((a, b) => Math.max(a, b));
    const unitUpgradeRows = Math.ceil(technologies.unitUpgrade.length / 4);
    return (techRows + unitUpgradeRows) * 55 + 100;
};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(calculateHeight)
    .setWidth(840)
    .setColor(new Color(0.027, 0.203, 0.466))
    .register();
