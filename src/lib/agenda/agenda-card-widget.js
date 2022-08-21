const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const {
    Card,
    ImageButton,
    ImageWidget,
    refPackageId,
} = require("../../wrapper/api");

const TEXTURE_PATH_WITHOUT_SOURCE = "/locale/ui/agenda";

/**
 * ImageWidget showing an agenda card.
 *
 * At the moment, keep individual images under "ui".  If and when TTPG can
 * select a card in a cardsheet this could share images with the deck(s).
 */
class AgendaCardWidget extends ImageWidget {
    static getImagePath(card) {
        assert(card instanceof Card);
        const agendaNsid = ObjectNamespace.getNsid(card);
        assert(agendaNsid.startsWith("card.agenda"));
        const parsed = ObjectNamespace.parseNsid(agendaNsid);
        assert(parsed);
        if (parsed.source.includes("homebrew")) {
            return undefined; // if the card has a custom image, use that instead?
        }
        return `${TEXTURE_PATH_WITHOUT_SOURCE}/${parsed.source}/${parsed.name}.jpg`;
    }

    constructor(card) {
        assert(card instanceof Card);
        const path = AgendaCardWidget.getImagePath(card);
        super();
        this.setImage(path, refPackageId);
        this.setImageSize(500, 750);
    }
}

class AgendaCardButton extends ImageButton {
    constructor(card) {
        assert(card instanceof Card);
        const path = AgendaCardWidget.getImagePath(card);
        super();
        this.setImage(path, refPackageId);
        this.setImageSize(500, 750);
    }
}

module.exports = { AgendaCardWidget, AgendaCardButton };
