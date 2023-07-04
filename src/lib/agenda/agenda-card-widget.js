const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const {
    Card,
    ImageButton,
    ImageWidget,
    refPackageId,
} = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");

/**
 * ImageWidget showing an agenda card.
 *
 * This used to pull in special images, but TTPG now supports card images.
 */
class AgendaCardWidget {
    static getImageWidget(card) {
        assert(card instanceof Card);
        const widget = new ImageWidget()
            .setImageSize(500, 750)
            .setImage("global/card/agenda.back.jpg", refPackageId);
        //.setSourceCard(card);
        Broadcast.chatAll(
            "TEMPORARILY DISABLING AGENDA CARD DISPLAY WHILE INVESTIGATING AN ISSUE",
            Broadcast.ERROR
        );
        return widget;
    }

    static getImageButton(card) {
        assert(card instanceof Card);
        const widget = new ImageButton()
            .setImageSize(500, 750)
            .setImage("global/card/agenda.back.jpg", refPackageId);
        //.setSourceCard(card);
        return widget;
    }

    constructor(card) {
        throw new Error("static only");
    }
}

module.exports = { AgendaCardWidget };
