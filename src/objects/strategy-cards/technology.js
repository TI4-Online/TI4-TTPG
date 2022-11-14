const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
    SCALE,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { ColorUtil } = require("../../lib/color/color-util");
const { CommandToken } = require("../../lib/command-token/command-token");
const { Technology } = require("../../lib/technology/technology");
const { TechCardUtil } = require("../../lib/card/tech-card-util");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const {
    refObject,
    refPackageId,
    world,
    Button,
    Canvas,
    Color,
    ImageWidget,
    LayoutBox,
} = require("../../wrapper/api");

const IMAGE_SIZE = 14 * SCALE;
const ROW_HEIGHT = 34 * SCALE;
const COL_WIDTH = 150 * SCALE;

const BUTTON_FONT_SIZE = FONT_SIZE_BODY * 0.9;
const BUTTON_WIDTH = COL_WIDTH * 0.95;
const BUTTON_HEIGHT = ROW_HEIGHT * 0.7;
const IMAGE_OFFSET_Y = ROW_HEIGHT * 0.6;

const techIcons = {
    unitUpgrade: {
        color: ColorUtil.colorFromHex("#ffffff"),
    },
    Red: {
        color: ColorUtil.colorFromHex("#cc0000"),
        activeIcon: "global/technology/warfare_tech_icon.png",
        disabledIcon: "global/technology/warfare_tech_disabled_icon.png",
    },
    Yellow: {
        color: ColorUtil.colorFromHex("#e5e500"),
        activeIcon: "global/technology/cybernetic_tech_icon.png",
        disabledIcon: "global/technology/cybernetic_tech_disabled_icon.png",
    },
    Green: {
        color: ColorUtil.colorFromHex("#008000"),
        activeIcon: "global/technology/biotic_tech_icon.png",
        disabledIcon: "global/technology/biotic_tech_disabled_icon.png",
    },
    Blue: {
        color: ColorUtil.colorFromHex("#3232ff"),
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

    const clickHandler = (button, player) => {
        const techName = button.getText();
        onTechResearched(techName, playerSlot);
    };
    const textColor = techIcons[tech.type].color;
    ColorUtil.validate(textColor);
    const techButton = new Button()
        .setFontSize(BUTTON_FONT_SIZE)
        .setText(tech.name)
        .setTextColor(textColor)
        .setEnabled(!ownedTechnologies.includes(tech));
    techButton.onClicked.add(ThrottleClickHandler.wrap(clickHandler));
    canvas.addChild(techButton, xOffset, yOffset, BUTTON_WIDTH, BUTTON_HEIGHT);

    let factionNsidName = tech.faction;
    if (tech.factions) {
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        factionNsidName = faction.nsidName;
    }

    if (factionNsidName) {
        const factionIcon = new ImageWidget()
            .setImage(
                world.TI4.getFactionByNsidName(factionNsidName).icon,
                packageId
            )
            .setImageSize(IMAGE_SIZE, IMAGE_SIZE);
        canvas.addChild(
            factionIcon,
            xOffset + BUTTON_WIDTH - IMAGE_SIZE * 1.2,
            yOffset + IMAGE_OFFSET_Y,
            IMAGE_SIZE,
            IMAGE_SIZE
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
                    .setImageSize(IMAGE_SIZE, IMAGE_SIZE);
                canvas.addChild(
                    techIcon,
                    xOffset + IMAGE_SIZE * numOfIcons * 0.7 + IMAGE_SIZE * 0.2,
                    yOffset + IMAGE_OFFSET_Y,
                    IMAGE_SIZE,
                    IMAGE_SIZE
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

const onTechResearched = (technologyName, playerSlot) => {
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
    const msgColor = playerDesk.color;

    const technology = Technology.getTechnologies(playerSlot).find(
        (tech) => tech.name === technologyName
    );

    if (technology.localeName == "strategy_card.technology.button.nekro") {
        let messageKey = "strategy_card.technology.message.nekro";
        let messageParameters = {
            playerName,
        };
        Broadcast.chatAll(locale(messageKey, messageParameters), msgColor);
        return;
    }

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
    const messageParameters = {
        playerName,
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

    TechCardUtil.moveCardsToCardHolder([technology.cardNsid], playerSlot);
    Broadcast.chatAll(locale(messageKey, messageParameters), msgColor);
};

function widgetFactory(playerDesk, strategyCardObj) {
    const playerSlot = playerDesk.playerSlot;
    const technologies = Technology.getTechnologiesByType(
        playerDesk.playerSlot
    );
    const ownedTechnologies = Technology.getOwnedPlayerTechnologies(playerSlot);
    const playerTechnologies = countPlayerTechsByType(playerSlot);
    let xOffset = 0;
    let yOffsetMax = 0;

    let canvas = new Canvas();

    ["Blue", "Red", "Yellow", "Green"].forEach((type) => {
        let yOffset = 0;
        technologies[type].forEach((tech) => {
            drawTechButton(
                canvas,
                xOffset,
                yOffset,
                tech,
                playerSlot,
                playerTechnologies,
                ownedTechnologies,
                refPackageId
            );

            yOffset += ROW_HEIGHT;
        });
        yOffsetMax = Math.max(yOffset, yOffsetMax);
        xOffset += COL_WIDTH;
    });

    technologies.unitUpgrade.forEach((tech, index) => {
        const techButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(tech.name);
        const xOffset = (tech.unitPosition % 4) * COL_WIDTH;
        const yOffset =
            yOffsetMax + Math.floor(tech.unitPosition / 4) * ROW_HEIGHT;
        canvas.addChild(
            techButton,
            xOffset,
            yOffset,
            BUTTON_WIDTH,
            BUTTON_HEIGHT
        );

        drawTechButton(
            canvas,
            xOffset,
            yOffset,
            tech,
            playerSlot,
            playerTechnologies,
            ownedTechnologies,
            refPackageId
        );
    });

    // Instead of forcing the overall widget size, place the canvas inside a fixed size box.
    const fixedSize = new LayoutBox()
        .setOverrideWidth(COL_WIDTH * 4)
        .setOverrideHeight(calculateHeight(playerSlot))
        .setChild(canvas);
    return [fixedSize];
}

const calculateHeight = (playerSlot) => {
    const technologies = Technology.getTechnologiesByType(playerSlot);
    const techRows = ["Blue", "Red", "Yellow", "Green"]
        .map((type) => technologies[type].length)
        .reduce((a, b) => Math.max(a, b), 0);
    const unitUpgradeRows = Math.ceil(technologies.unitUpgrade.length / 4);
    return (techRows + unitUpgradeRows) * ROW_HEIGHT;
};

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.027, 0.203, 0.466))
    .setBodyWidgetFactory(widgetFactory)
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    );
