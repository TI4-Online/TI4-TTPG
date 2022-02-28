const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const PositionToPlanet = require("../system/position-to-planet");
const { DealDiscard } = require("../card/deal-discard");
const { ObjectNamespace } = require("../object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const { ATTACHMENTS } = require("../../objects/attachments/attachment.data");
const {
    GameObject,
    Player,
    Rotator,
    Vector,
    world,
} = require("../../wrapper/api");

/**
 * Planet exploration.  Attachment tokens already know how to attach, this
 * handles:
 * 1. draw the card,
 * 2. find or spawn the token,
 * 3. trigger attach.
 */
class Explore {
    static getExploreActionNamesAndActions(systemTileObj) {
        assert(systemTileObj instanceof GameObject);

        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        assert(system);

        const namesAndActions = [];
        if (system.planets.length > 0) {
            for (const planet of system.planets) {
                if (!planet.firstTrait) {
                    continue;
                }
                namesAndActions.push({
                    name: locale("ui.action.system.explore", {
                        planetName: planet.getNameStr(),
                    }),
                    action: (player) => {
                        assert(player instanceof Player);
                        const overrideTrait = false;
                        Explore.onExplorePlanetAction(
                            systemTileObj,
                            planet,
                            overrideTrait,
                            player
                        );
                    },
                });
            }
        } else {
            namesAndActions.push({
                name: locale("ui.action.system.explore", {
                    planetName: locale("token.frontier"),
                }),
                action: (player) => {
                    const planet = false;
                    const overrideTrait = "frontier";
                    Explore.onExplorePlanetAction(
                        systemTileObj,
                        planet,
                        overrideTrait,
                        player
                    );
                },
            });
        }
        return namesAndActions;
    }

    /**
     * Player triggered explore.
     *
     * @param {GameObject} systemTileObj
     * @param {Planet|false} planet
     * @param {string|false} overrideTrait
     * @param {Player} player
     */
    static onExplorePlanetAction(systemTileObj, planet, overrideTrait, player) {
        assert(systemTileObj instanceof GameObject);
        assert(!overrideTrait || typeof overrideTrait === "string");
        assert(player instanceof Player);

        // Which trait to explore?
        const trait = overrideTrait ? overrideTrait : planet.firstTrait;
        if (!trait) {
            return;
        }

        // Sanity check trait is a known exploration deck.
        const deckNsidPrefix = `card.exploration.${trait}`;
        assert(DealDiscard.isKnownDeck(deckNsidPrefix));

        // Where to draw the card?
        let pos = false;
        if (planet) {
            pos = PositionToPlanet.getWorldPosition(
                systemTileObj,
                planet.position
            );
        } else {
            pos = systemTileObj.getPosition();
        }

        // Draw the card.
        const count = 1;
        const rot = new Rotator(0, 0, 180);
        const card = DealDiscard.dealToPosition(
            deckNsidPrefix,
            count,
            pos.add([0, 0, 10]),
            rot
        );
        if (!card) {
            return;
        }

        // Is there an attachment?
        const nsid = ObjectNamespace.getNsid(card);
        let attachmentData = false;
        let tokenNsid = false;
        for (const attachment of ATTACHMENTS) {
            if (attachment.cardNsid == nsid) {
                attachmentData = attachment;
                tokenNsid = attachment.tokenNsid;
                break;
            }
        }
        if (!tokenNsid) {
            return;
        }

        // Flip if planet has a tech.
        const tokenRot = new Rotator(rot.pitch, rot.yaw, 0);
        if (planet && planet.firstTech) {
            tokenRot.roll = 180;
        }

        // Find token, might be in a bag.
        let tokenObj = false;
        if (!attachmentData.spawn) {
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === tokenNsid) {
                    const container = obj.getContainer();
                    if (container) {
                        const above = container.getPosition().add([0, 0, 10]);
                        container.take(obj, above);
                    }
                    tokenObj = obj;
                    break;
                }
            }
        }

        // Nope, spawn one.
        if (!tokenObj) {
            const pos = new Vector(1000, 0, world.getTableHeight() + 10);
            const rot = new Rotator(0, 0, 0);
            tokenObj = Spawn.spawn(tokenNsid, pos, rot);
            assert(tokenObj);
        }
        tokenObj.setRotation(tokenRot, 0);

        // Move to location.
        tokenObj.setPosition(pos, 0);
        tokenObj.setRotation(tokenRot, 0);
        if (tokenObj.__attachment) {
            // Script on object onCreated called during spawn
            tokenObj.__attachment.attach(planet, systemTileObj);
        }
    }
}

module.exports = { Explore };
