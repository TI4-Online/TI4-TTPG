const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AbstractRightClickCard } = require("./abstract-right-click-card");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const { Card, ObjectType, Rotator, world } = require("../../wrapper/api");

const ACTION_NAME = "*" + locale("ui.menu.fetch_attachment_token");

class RightClickStellarConverter extends AbstractRightClickCard {
    static fetchAttachmentToken(card, tokenNsid) {
        assert(card instanceof Card);
        assert(typeof tokenNsid === "string");

        const pos = card.getPosition().add([0, 0, 5]);
        const rot = new Rotator(0, 0, 0);

        // Find token.
        let token = undefined;
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== tokenNsid) {
                continue;
            }
            token = obj;
            break;
        }

        // Spawn if missing.
        if (!token) {
            token = Spawn.spawn(tokenNsid, pos, rot);
        }

        // Remove from container.
        const container = token.getContainer();
        if (container) {
            const above = container.getPosition().add([0, 0, 10]);
            container.take(token, above, false);
        }

        // Move.
        token.setObjectType(ObjectType.Regular);
        token.setPosition(pos, 1);
        token.setRotation(rot);
    }

    constructor() {
        super();
    }

    isRightClickable(card) {
        const nsid = ObjectNamespace.getNsid(card);
        return nsid === "card.relic:pok/stellar_converter";
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            const tokenNsid = "token.exploration:pok/stellar_converter";
            RightClickStellarConverter.fetchAttachmentToken(card, tokenNsid);
        }
    }
}

new RightClickStellarConverter();
