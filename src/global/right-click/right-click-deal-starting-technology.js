const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Technology } = require("../../lib/technology/technology");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, world } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

function getStartinTechNameAndActions(faction) {
    if (!faction || !faction.raw.startingTechChoices) {
        return [];
    }

    return faction.raw.startingTechChoices.map((tech) => {
        return {
            actionName:
                "*" +
                locale("ui.menu.deal", {
                    card: locale(`technology.name.${tech}`),
                }),
            tooltip: undefined,
        };
    });
}

class RightClickDealStatringTechnology extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        assert(card instanceof Card);
        const nsid = ObjectNamespace.getNsid(card);
        return nsid.startsWith("card.starting_technology");
    }

    getRightClickActionNamesAndTooltips(card) {
        assert(card instanceof Card);

        const nsid = ObjectNamespace.getNsid(card);
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            throw new Error(
                `getRightClickActionNamesAndTooltips: bad nsid "${nsid}"`
            );
        }
        const faction = world.TI4.getFactionByNsidName(parsed.name);

        return getStartinTechNameAndActions(faction);
    }

    onRightClick(card, player, selectedActionName) {
        const drawTechActionPrefix =
            "*" +
            locale("ui.menu.deal", {
                card: "",
            });
        if (selectedActionName.startsWith(drawTechActionPrefix)) {
            const techName = selectedActionName.replace(
                drawTechActionPrefix,
                ""
            );
            Technology.onTechResearched(techName, player.getSlot(), true);
        }
    }
}

new RightClickDealStatringTechnology();
