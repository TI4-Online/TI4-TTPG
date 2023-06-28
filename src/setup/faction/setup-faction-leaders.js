const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const { Card, Vector, world } = require("../../wrapper/api");

const LEADERS = {
    agent: {
        sheetLocalOffset: { x: 6.88, y: -0.11, z: 5 },
        roll: 180,
    },
    commander: {
        sheetLocalOffset: { x: 2.28, y: -0.1, z: 5 },
        roll: 0,
    },
    hero: {
        sheetLocalOffset: { x: -2.28, y: -0.11, z: 5 },
        roll: 0,
    },
    mech: {
        sheetLocalOffset: { x: -6.88, y: -0.11, z: 5 },
        roll: 180,
    },
};
const EXTRA_LEADER_OFFSET_Y = -2;

class SetupFactionLeaders extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        if (!world.TI4.config.pok) {
            return;
        }

        // Arbitrary, will move to leader sheet later.
        const pos = this.playerDesk.pos.add([0, 0, 5]);
        const rot = this.playerDesk.rot;

        const acceptNames = this._getLeaderNsidNames();
        const nsidPrefix = "card.leader";
        const deck = this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.leader.agent.x"
            const factionName = this.parseNsidGetTypePart(nsid, nsidPrefix, 3);
            if (factionName !== this._faction.raw.faction) {
                return false;
            }
            // Check if legal name.  Include "name.omega", etc versions.
            const parsed = ObjectNamespace.parseNsid(nsid);
            const name = parsed.name.split(".")[0];
            if (!acceptNames.has(name)) {
                // Unwanted card in the deck, or a typo?
                console.log(
                    `SetupFactionLeaders.setup: unregistered "${nsid}"`
                );
                console.log(
                    `missing "${name}" from ${Array.from(acceptNames)}`
                );
                return false;
            }
            // If unit,
            return true;
        });

        this._moveLeadersToSheet(deck);
    }

    clean() {
        const acceptNames = this._getLeaderNsidNames();
        const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
            if (!nsid.startsWith("card.leader")) {
                return false;
            }
            const pos = cardOrDeck.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            return acceptNames.has(parsed.name);
        });
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            card.destroy();
        }
    }

    _getLeaderNsidNames() {
        // Only use items listed in faction tables, not just because in deck.
        const acceptNames = new Set();
        this.faction.raw.leaders.agents.forEach((name) =>
            acceptNames.add(name)
        );
        this.faction.raw.leaders.commanders.forEach((name) =>
            acceptNames.add(name)
        );
        this.faction.raw.leaders.heroes.forEach((name) =>
            acceptNames.add(name)
        );
        this.faction.raw.units.forEach((name) => {
            const unitAttrs = UnitAttrs.getNsidNameUnitUpgrade(name);
            if (!unitAttrs) {
                throw new Error(`missing unit attrs for "name"`);
            }
            if (unitAttrs.raw.unit === "mech") {
                acceptNames.add(name);
            }
        });
        return acceptNames;
    }

    _moveLeadersToSheet(leaderDeck) {
        assert(leaderDeck instanceof Card);

        // Find the leader sheet.
        const leaderSheetNsid = "sheet:pok/leader";
        const leaderSheet = this.findObjectOwnedByPlayerDesk(leaderSheetNsid);
        if (!leaderSheet) {
            return; // no leaderSheet sheet? abort.
        }

        const leaderTypeToCount = {
            agent: 0,
            commander: 0,
            hero: 0,
            mech: 0,
        };

        const cardObjectArray = CardUtil.separateDeck(leaderDeck);

        cardObjectArray.forEach((card) => {
            const nsid = ObjectNamespace.getNsid(card);
            let leaderType = false;
            if (nsid.startsWith("card.leader")) {
                leaderType = nsid.split(".")[2];
            } else if (nsid.startsWith("card.alliance")) {
                leaderType = "commander";
            }
            const count = leaderTypeToCount[leaderType];
            assert(typeof count === "number");
            leaderTypeToCount[leaderType] = count + 1;
            const leaderData = LEADERS[leaderType];
            const o = leaderData.sheetLocalOffset;
            const localOffset = new Vector(o.x, o.y, o.z).add([
                0,
                EXTRA_LEADER_OFFSET_Y * count,
                count,
            ]);
            const pos = leaderSheet.localPositionToWorld(localOffset);
            const rot = leaderSheet.localRotationToWorld([
                0,
                0,
                leaderData.roll,
            ]);
            card.setPosition(pos);
            card.setRotation(rot);
        });
    }
}

module.exports = { SetupFactionLeaders };
