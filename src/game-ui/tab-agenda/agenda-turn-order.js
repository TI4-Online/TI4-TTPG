const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");

// Hack Election: During this agenda, voting begins with the player to the
// right of the speaker and continues counterclockwise.
const REVERSE_ORDER_NSID = "card.action:codex.ordinian/hack_election";

let _speakerTokenObj = undefined;

class AgendaTurnOrder {
    /**
     * Find the speaker token.  It is an error if missing.
     *
     * @returns {GameObject}
     */
    static findSpeakerToken() {
        if (_speakerTokenObj && _speakerTokenObj.isValid()) {
            return _speakerTokenObj;
        }

        const speakerTokenNsid = "token:base/speaker";
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === speakerTokenNsid) {
                _speakerTokenObj = obj;
                return obj;
            }
        }
        throw new Error("missing speaker token");
    }

    /**
     * Get the player desk with the speaker token.
     *
     * @returns {PlayerDesk}
     */
    static getSpeakerPlayerDesk() {
        const speakerToken = AgendaTurnOrder.findSpeakerToken();
        assert(speakerToken);
        const pos = speakerToken.getPosition();
        return world.TI4.getClosestPlayerDesk(pos);
    }

    /**
     * "When" and "after" resolve order.
     *
     * [2.9] Players take turns resolving action cards starting with the
     * speaker and proceeding clockwise.
     *
     * @returns {Array.{PlayerDesk}}
     */
    static getResolveOrder() {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const speakerPlayerDesk = AgendaTurnOrder.getSpeakerPlayerDesk();
        assert(speakerPlayerDesk);

        const first = speakerPlayerDesk.index;
        const result = [];
        for (let i = 0; i < playerDesks.length; i++) {
            const index = (first + i) % playerDesks.length;
            result.push(playerDesks[index]);
        }
        return result;
    }

    /**
     * [8.2] Each player, starting with the player to the left of the
     * speaker and continuing clockwise, can cast votes for an outcome
     * of the current agenda.
     *
     * Should this remove players with riders / political secret?
     */
    static getVoteOrder() {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const speakerPlayerDesk = AgendaTurnOrder.getSpeakerPlayerDesk();
        assert(speakerPlayerDesk);

        let dir = 1;

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === REVERSE_ORDER_NSID) {
                dir = -dir;
                break;
            }
        }

        const first = speakerPlayerDesk.index + dir;
        const result = [];
        for (let i = 0; i < playerDesks.length; i++) {
            let index = first + i * dir;
            while (index < 0) {
                index += playerDesks.length;
            }
            index = index % playerDesks.length;
            result.push(playerDesks[index]);
        }
        return result;
    }
}

module.exports = { AgendaTurnOrder, REVERSE_ORDER_NSID };
