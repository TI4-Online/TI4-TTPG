const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { Card, ImageButton, ImageWidget } = require("../../wrapper/api");

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
            .setSourceCard(card);
        return widget;
    }

    static getImageButton(card) {
        assert(card instanceof Card);
        const widget = new ImageButton()
            .setImageSize(500, 750)
            .setSourceCard(card);
        return widget;
    }

    constructor(card) {
        throw new Error("static only");
    }
}

module.exports = { AgendaCardWidget };
