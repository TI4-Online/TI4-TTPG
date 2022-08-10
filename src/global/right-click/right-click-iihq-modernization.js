const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { CardUtil } = require("../../lib/card/card-util");
const { Card, Player } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

const LEGENDARY_NSID = "card.legendary_planet:codex.vigil/custodia_vigilia";
const PLANET_NSID = "card.planet:codex.vigil/custodia_vigilia";

function fetchCustodiaVigilia(player) {
    var pos = player.getCursorPosition().add([0, 0, 5]);
    const planetCard = CardUtil.gatherCards((nsid, _cardOrDeck) => {
        return nsid === PLANET_NSID;
    })[0];
    planetCard.setPosition(pos);

    // planet is gained exhausted, ensure the card comes face down
    const planetCardRot = planetCard.getRotation();
    if (planetCard.isFaceUp()) {
        planetCard.setRotation(planetCardRot.compose([0, 0, 180]));
    }

    const legendaryCard = CardUtil.gatherCards((nsid, _cardOrDeck) => {
        return nsid === LEGENDARY_NSID;
    })[0];
    legendaryCard.setPosition(pos.add([1, 1, 5]));

    // legendary card is not exhaustable, ensure it comes face up
    const legendaryCardRot = legendaryCard.getRotation();
    if (!legendaryCard.isFaceUp()) {
        legendaryCard.setRotation(legendaryCardRot.compose([0, 0, 180]));
    }
}

class RightClickIihqModernization extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        assert(card instanceof Card);
        const parsedCard = ObjectNamespace.parseCard(card);
        const name = parsedCard?.name;
        return name && name.startsWith("iihq_modernization");
    }

    getRightClickActionNamesAndTooltips(card) {
        const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
        const tooltip = undefined;
        return [{ actionName, tooltip }];
    }

    onRightClick(card, player, selectedActionName) {
        assert(card instanceof Card);
        assert(player instanceof Player);
        assert(typeof selectedActionName === "string");

        const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
        if (selectedActionName === actionName) {
            fetchCustodiaVigilia(player);
        }
    }
}

// Create and register self
new RightClickIihqModernization();
