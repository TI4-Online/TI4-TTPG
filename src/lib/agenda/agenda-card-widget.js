const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { ImageButton, ImageWidget, refPackageId } = require("../../wrapper/api");

const TEXTURE_PATH_WITHOUT_SOURCE = "/locale/ui/agenda";

/**
 * ImageWidget showing an agenda card.
 *
 * At the moment, keep individual images under "ui".  If and when TTPG can
 * select a card in a cardsheet this could share images with the deck(s).
 */
class AgendaCardWidget extends ImageWidget {
    static getImagePath(agendaNsid) {
        assert(typeof agendaNsid === "string");
        assert(agendaNsid.startsWith("card.agenda"));
        const parsed = ObjectNamespace.parseNsid(agendaNsid);
        assert(parsed);
        return `${TEXTURE_PATH_WITHOUT_SOURCE}/${parsed.source}/${parsed.name}.jpg`;
    }

    constructor(agendaNsid) {
        assert(typeof agendaNsid === "string");
        const path = AgendaCardWidget.getImagePath(agendaNsid);
        super();
        this.setImage(path, refPackageId);
        this.setImageSize(500, 750);
    }
}

class AgendaCardButton extends ImageButton {
    constructor(agendaNsid) {
        assert(typeof agendaNsid === "string");
        const path = AgendaCardWidget.getImagePath(agendaNsid);
        super();
        this.setImage(path, refPackageId);
        this.setImageSize(500, 750);
    }
}

module.exports = { AgendaCardWidget, AgendaCardButton };
