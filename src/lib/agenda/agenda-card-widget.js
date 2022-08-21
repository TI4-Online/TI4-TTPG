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
    static setImagePath(widget, card) {
        assert(widget instanceof ImageWidget || widget instanceof ImageButton);
        assert(card instanceof Card);

        const agendaNsid = ObjectNamespace.getNsid(card);
        assert(agendaNsid.startsWith("card.agenda"));
        const parsed = ObjectNamespace.parseNsid(agendaNsid);
        assert(parsed);

        if (parsed.source.includes("homebrew")) {
            // There is no method to read the custom image, pull it from the save JSON.
            // If no URL do not set the image.
            const json = JSON.parse(card.toJSONString());
            const url = json.frontTextureOverride;
            if (url && url.startsWith("http")) {
                widget.setImageURL(url);
            }
        } else {
            const path = `${TEXTURE_PATH_WITHOUT_SOURCE}/${parsed.source}/${parsed.name}.jpg`;
            widget.setImage(path, refPackageId);
        }

        widget.setImageSize(500, 750);
    }

    constructor(card) {
        assert(card instanceof Card);
        super();
        AgendaCardWidget.setImagePath(this, card);
    }
}

class AgendaCardButton extends ImageButton {
    constructor(card) {
        assert(card instanceof Card);
        super();
        AgendaCardWidget.setImagePath(this, card);
    }
}

module.exports = { AgendaCardWidget, AgendaCardButton };
