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
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const { Technology } = require("../../lib/technology/technology");
const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");

const imageSize = 30;

const factionIcons = {
    arborec: "global/factions/arborec_icon.png",
    argent: "global/factions/argent_icon.png",
    creuss: "global/factions/creuss_icon.png",
    empyrean: "global/factions/empyrean_icon.png",
    hacan: "global/factions/hacan_icon.png",
    jolnar: "global/factions/jolnar_icon.png",
    l1z1x: "global/factions/l1z1x_icon.png",
    letnev: "global/factions/letnev_icon.png",
    mahact: "global/factions/mahact_icon.png",
    mentak: "global/factions/mentak_icon.png",
    muaat: "global/factions/muaat_icon.png",
    naalu: "global/factions/naalu_icon.png",
    naazrokha: "global/factions/naazrokha_icon.png",
    nekro: "global/factions/nekro_icon.png",
    nomad: "global/factions/nomad_icon.png",
    norr: "global/factions/norr_icon.png",
    saar: "global/factions/saar_icon.png",
    sol: "global/factions/sol_icon.png",
    ul: "global/factions/ul_icon.png",
    vuilraith: "global/factions/vuilraith_icon.png",
    winnu: "global/factions/winnu_icon.png",
    xxcha: "global/factions/xxcha_icon.png",
    yin: "global/factions/yin_icon.png",
    yssaril: "global/factions/yssaril_icon.png",
};

const techIcons = {
    unitUpgrade: {
        color: new Color(1, 1, 1),
    },
    Red: {
        color: new Color(1, 0, 0),
        activeIcon: "global/technology/warfare_tech_icon.png",
        disabledIcon: "global/technology/warfare_tech_disabled_icon.png",
    },
    Yellow: {
        color: new Color(1, 1, 0),
        activeIcon: "global/technology/cybernetic_tech_icon.png",
        disabledIcon: "global/technology/cybernetic_tech_disabled_icon.png",
    },
    Green: {
        color: new Color(0, 1, 0),
        activeIcon: "global/technology/biotic_tech_icon.png",
        disabledIcon: "global/technology/biotic_tech_disabled_icon.png",
    },
    Blue: {
        color: new Color(0, 0, 1),
        activeIcon: "global/technology/propulsion_tech_icon.png",
        disabledIcon: "global/technology/propulsion_tech_disabled_icon.png",
    },
};

function drawTechButton(
    canvas,
    xOffset,
    yOffset,
    tech,
    playerSlot,
    playerTechnologies,
    ownedTechnologies,
    packageId
) {
    assert(typeof packageId === "string");

    let techButton = new Button()
        .setText(tech.name)
        .setTextColor(techIcons[tech.type].color)
        .setEnabled(!ownedTechnologies.includes(tech));
    techButton.onClicked.add((button, player) => {
        const techName = button.getText();
        onTechResearched(techName, playerSlot);
    });
    canvas.addChild(techButton, xOffset, yOffset, 200, 35);

    if (tech.faction) {
        let factionIcon = new ImageWidget()
            .setImage(factionIcons[tech.faction], packageId)
            .setImageSize(imageSize, imageSize);
        canvas.addChild(
            factionIcon,
            xOffset + 160,
            yOffset + 23,
            imageSize,
            imageSize
        );
    }

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
    let playerTechnologies = {
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

const onTechResearched = (technologyName, playerSlot) => {
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const player = world.getPlayerBySlot(playerSlot);

    const technology = Technology.getTechnologies(playerSlot).find(
        (tech) => tech.name === technologyName
    );
    const ownedTechnologies = countPlayerTechsByType(playerSlot);
    const skippedTechs = {};

    for (let requirement in technology.requirements) {
        const required = technology.requirements[requirement];
        const owned = ownedTechnologies[requirement];

        if (required > owned) {
            skippedTechs[requirement] = required - owned;
        }
    }

    let messageKey = "strategy_card.technology.message.researched";
    let messageParameters = {
        playerName: player ? player.getName() : playerDesk.colorName,
        technologyName: technologyName,
        skips: "",
    };

    if (Object.keys(skippedTechs).length) {
        messageKey = "strategy_card.technology.message.researched_and_skips";
        for (let requirement in skippedTechs) {
            if (messageParameters.skips) {
                messageParameters.skips += ", ";
            }

            const techType = locale(`technology.type.${requirement}`);

            messageParameters.skips += `${skippedTechs[requirement]} ${techType}`;
        }
        console.log(
            `skippedTechs: ${JSON.stringify(skippedTechs)} - skips: ${
                messageParameters.skips
            }`
        );
    }

    Broadcast.chatAll(locale(messageKey, messageParameters), playerDesk.color);
};

function widgetFactory(playerDesk, packageId) {
    assert(typeof packageId === "string");

    const playerSlot = playerDesk.playerSlot;
    const technologies = Technology.getTechnologiesByType(
        playerDesk.playerSlot
    );
    const ownedTechnologies = Technology.getOwnedPlayerTechnologies(playerSlot);
    const playerTechnologies = countPlayerTechsByType(playerSlot);
    let xOffset = 0;
    let yOffsetMax = 0;

    let canvas = new Canvas();

    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.technology.text"));
    canvas.addChild(headerText, 0, 0, 200, 35);

    ["Blue", "Red", "Yellow", "Green"].forEach((type) => {
        let yOffset = 50;
        technologies[type].forEach((tech) => {
            drawTechButton(
                canvas,
                xOffset,
                yOffset,
                tech,
                playerSlot,
                playerTechnologies,
                ownedTechnologies,
                packageId
            );

            if (Object.keys(tech.requirements).length > 0) {
                yOffset += 15;
            }

            yOffset += 40;
        });
        yOffsetMax = Math.max(yOffset, yOffsetMax);
        xOffset += 210;
    });

    technologies.unitUpgrade.forEach((tech, index) => {
        let techButton = new Button().setText(tech.name);
        const xOffset = (tech.unitPosition % 4) * 210;
        const yOffset = yOffsetMax + 20 + 
          Math.floor(tech.unitPosition / 4) * 60;
        canvas.addChild(techButton, xOffset, yOffset, 200, 35);

        drawTechButton(
            canvas,
            xOffset,
            yOffset,
            tech,
            playerSlot,
            playerTechnologies,
            ownedTechnologies,
            packageId
        );
    });

    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.close"));
    closeButton.onClicked.add(onUiClosedClicked);
    canvas.addChild(
        closeButton,
        0,
        calculateHeight(playerDesk.playerSlot) - 45,
        830,
        48
    );

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
    .setWidth(833)
    .setColor(new Color(0.027, 0.203, 0.466))
    .register();
