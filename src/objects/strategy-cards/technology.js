const {
    broadcastMessage,
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

const factionIcons = {
    arborec: "../../Textures/global/factions/arborec_icon.jpg",
    argent: "../../Textures/global/factions/argent_icon.jpg",
    cressus: "../../Textures/global/factions/cressus_icon.jpg",
    empyrean: "../../Textures/global/factions/empyrean_icon.jpg",
    hacan: "../../Textures/global/factions/hacan_icon.jpg",
    jolnar: "../../Textures/global/factions/jolnar_icon.jpg",
    l1z1x: "../../Textures/global/factions/l1z1x_icon.jpg",
    letnev: "../../Textures/global/factions/letnev_icon.jpg",
    mahact: "../../Textures/global/factions/mahact_icon.jpg",
    mentak: "../../Textures/global/factions/mentak_icon.jpg",
    muaat: "../../Textures/global/factions/arborec_icon.jpg",
    naalu: "../../Textures/global/factions/naalu_icon.jpg",
    naazrokha: "../../Textures/global/factions/naazrokha_icon.jpg",
    nekro: "../../Textures/global/factions/nekro_icon.jpg",
    nomad: "../../Textures/global/factions/nomad_icon.jpg",
    norr: "../../Textures/global/factions/norr_icon.jpg",
    saar: "../../Textures/global/factions/saar_icon.jpg",
    sol: "../../Textures/global/factions/sol_icon.jpg",
    ui: "../../Textures/global/factions/ul_icon.jpg",
    vuilraith: "../../Textures/global/factions/vuilraith_icon.jpg",
    winnu: "../../Textures/global/factions/winnu_icon.jpg",
    xxcha: "../../Textures/global/factions/xxcha_icon.jpg",
    yin: "../../Textures/global/factions/yin_icon.jpg",
    yssaril: "../../Textures/global/factions/yssaril_icon.jpg",
};

const TechIcons = {
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

const countPlayerTechsByType = (playerSlot) => {
    const playerTechnologies = {
        Blue: 0,
        Red: 0,
        Yellow: 0,
        Green: 0,
    };

    Technology.getOwnedPlayerTechnologies(playerSlot)
        .filter((tech) =>
            ["Blue", "Red", "Yellow", "Green"].includes(tech.type)
        )
        .forEach((tech) => {
            playerTechnologies[tech.type]++;
        });

    return playerTechnologies;
};

const onTechResearched = (button, player) => {
    const technologyName = button.getText();
    const playerSlot = player.getSlot();
    const technology = Technology.getTechnologies(playerSlot).find(
        (tech) => tech.name === technologyName
    );
    const ownedTechnologies = countPlayerTechsByType(playerSlot);
    const skippedTechs = {};

    for (let requirement in technology.requirements) {
        const required = technology[requirement];
        const owned = ownedTechnologies[requirement];
        if (required > owned) {
            skippedTechs[requirement] = required - owned;
        }
    }

    let messageKey = "strategy_card.technology.message.researched";
    let messageParameters = {
        playerName: player.getName(),
        technologyName: technologyName,
    };

    if (Object.keys(skippedTechs).length) {
        messageKey = "strategy_card.technology.message.researched_and_skips";
        messageParameters.skips = "";
        for (let requirement in skippedTechs) {
            if (messageParameters.skips) {
                messageParameters.skips += ", ";
            }

            const techType = locale(`technology.type.${requirement}`);

            messageParameters.skip += `${skippedTechs[requirement]} ${techType}`;
        }
    }

    broadcastMessage(messageKey, messageParameters, player);
};

function widgetFactory(playerDesk, packageId) {
    const playerSlot = playerDesk.playerSlot;
    const technologies = Technology.getTechnologiesByType(playerSlot);
    const ownedTechnologies = Technology.getOwnedPlayerTechnologies(playerSlot);
    const playerTechnologies = countPlayerTechsByType(playerSlot);
    let xOffset = 0;
    let yOffsetMax = 0;

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

    ["Blue", "Red", "Yellow", "Green"].forEach((type) => {
        let yOffset = 50;
        technologies[type].forEach((tech) => {
            let techButton = new Button()
                .setText(tech.name)
                .setTextColor(TechIcons[type].color)
                .setEnabled(!ownedTechnologies.includes(tech))
                .onClicked.add(onTechResearched);
            canvas.addChild(techButton, xOffset, yOffset, 200, 35);

            if (tech.faction) {
                let factionIcon = new ImageWidget().setImage(
                    factionIcons[tech.faction]
                );
                canvas.addChild(factionIcon, xOffset + 170, yOffset, 20, 20);
            }

            if (Object.keys(tech.requirements).length > 0) {
                yOffset += 15;
                for (let requirement in tech.requirements) {
                    for (let i = 0; i < tech.requirements[requirement]; i++) {
                        const image =
                            playerTechnologies[requirement] > i
                                ? TechIcons[requirement].activeIcon
                                : TechIcons[requirement].disabledIcon;
                        let techIcon = new ImageWidget().setImage(image);
                        canvas.addChild(
                            techIcon,
                            xOffset + 15 * i,
                            yOffset + 12,
                            200,
                            35
                        );
                    }
                }
            }
            yOffset += 40;
        });
        yOffsetMax = Math.max(yOffset, yOffsetMax);
        xOffset += 210;
    });

    technologies.unitUpgrade.forEach((tech, index) => {
        let techButton = new Button().setText(tech.name);
        const xOffset = (index % 4) * 210;
        const yOffset = yOffsetMax + 20 + Math.floor(index / 4) * 60;
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
