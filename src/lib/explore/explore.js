const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const PositionToPlanet = require("../system/position-to-planet");
const { Broadcast } = require("../broadcast");
const { CardUtil } = require("../card/card-util");
const { DealDiscard } = require("../card/deal-discard");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { Plague } = require("../actions/plague");
const { Spawn } = require("../../setup/spawn/spawn");
const { UnitPlastic } = require("../unit/unit-plastic");
const { WidgetFactory } = require("../ui/widget-factory");
const { ATTACHMENTS } = require("../../objects/attachments/attachment.data");
const {
    Card,
    GameObject,
    Player,
    Rotator,
    Vector,
    ObjectType,
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
    static getDistantSunsPlanets(systemTileObj, player) {
        assert(systemTileObj instanceof GameObject);
        if (!player) {
            return;
        }
        assert(player instanceof Player);

        const slot = player.getSlot();
        const faction = world.TI4.getFactionByPlayerSlot(slot);
        if (!faction) {
            return;
        }
        if (!faction.raw.abilities.includes("distant_suns")) {
            return;
        }

        const hex = Hex.fromPosition(systemTileObj.getPosition());
        const allPlastic = UnitPlastic.getAll();
        const hexPlastic = allPlastic.filter((plastic) => plastic.hex === hex);
        const mechPlastic = hexPlastic.filter(
            (plastic) => plastic.unit === "mech"
        );
        const playersMechs = mechPlastic.filter(
            (plastic) => plastic.owningPlayerSlot === slot
        );
        UnitPlastic.assignPlanets(playersMechs);
        let distantSunsPlanets = playersMechs.map(
            (plastic) => plastic.planet.localeName
        );
        // Filter to unique.
        distantSunsPlanets = distantSunsPlanets.filter(
            (value, index, self) => self.indexOf(value) === index
        );
        return distantSunsPlanets;
    }

    static getExploreActionNamesAndActions(systemTileObj, player) {
        assert(systemTileObj instanceof GameObject);
        assert(!player || player instanceof Player);

        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (!system) {
            return;
        }

        const distantSunsPlanets = Explore.getDistantSunsPlanets(
            systemTileObj,
            player
        );

        const namesAndActions = [];
        if (system.planets.length > 0) {
            for (const planet of system.planets) {
                const traits = [...new Set(planet.traits)]; // unique
                for (const trait of traits) {
                    let planetName = planet.getNameStr();
                    let overrideTrait = false;
                    if (traits.length > 1) {
                        planetName =
                            planetName + " " + locale("trait." + trait);
                        overrideTrait = trait;
                    }
                    namesAndActions.push({
                        name: locale("ui.action.system.explore", {
                            planetName,
                        }),
                        action: (player) => {
                            assert(player instanceof Player);
                            Explore.onExplorePlanetAction(
                                systemTileObj,
                                planet,
                                overrideTrait,
                                player
                            );
                        },
                    });
                    if (
                        distantSunsPlanets &&
                        distantSunsPlanets.includes(planet.localeName)
                    ) {
                        namesAndActions.push({
                            name: locale(
                                "ui.action.system.distant_suns_explore",
                                {
                                    planetName,
                                }
                            ),
                            action: (player) => {
                                assert(player instanceof Player);
                                Explore.doubleExplore(
                                    systemTileObj,
                                    planet,
                                    overrideTrait,
                                    player
                                );
                            },
                        });
                    }
                }
            }
        } else {
            namesAndActions.push({
                name: locale("ui.action.system.explore", {
                    planetName: locale("token.frontier"),
                }),
                action: (player) => {
                    const planet = false;
                    const overrideTrait = "frontier";
                    Explore.removeFrontierToken(systemTileObj);
                    Explore.onExplorePlanetAction(
                        systemTileObj,
                        planet,
                        overrideTrait,
                        player
                    );
                },
            });
        }

        // If plague is face up on the table, offer to plague planets.
        if (Plague.isPlagueActive()) {
            if (system.planets.length > 0) {
                for (const planet of system.planets) {
                    let planetName = planet.getNameStr();
                    namesAndActions.push({
                        name: locale("ui.action.system.plague", {
                            planetName,
                        }),
                        action: (player) => {
                            Plague.plague(systemTileObj, planet, player);
                        },
                    });
                }
            }
        }

        return namesAndActions;
    }

    /**
     * Make sure there are no locked objects that will interfere with token
     * placement.  Move any objects up very slightly, DO NOT RE-LOCK.
     *
     * @param {GameObject} tokenObj
     * @param {Vector} pos
     * @returns {Array.{GameObject}} - lifted objects
     */
    static reserveTokenSpace(tokenObj, pos) {
        assert(tokenObj instanceof GameObject);
        assert(typeof pos.x === "number");

        // Anchor at table height for consisent scan area.
        // Make a capsule since a stack could get high.
        const scanPos = new Vector(pos.x, pos.y, world.getTableHeight());
        const tokenExtent = tokenObj.getExtent();
        const d = Math.max(tokenExtent.x, tokenExtent.y, tokenExtent.z);
        const scanExtent = new Vector(d, d, d + 10);

        // Collect objects that need moving.
        const hitObjects = world.capsuleOverlap(scanPos, scanExtent);
        const moveObjects = hitObjects.filter((hitObject) => {
            // Ignore the system tile.
            if (ObjectNamespace.isSystemTile(hitObject)) {
                return false;
            }
            // Ignore the token.
            if (hitObject === tokenObj) {
                return false;
            }
            // Accept units.
            if (UnitPlastic.getOne(hitObject)) {
                return true;
            }
            // Accept cards.
            if (hitObject instanceof Card) {
                return true;
            }
            return false; // reject everything else
        });

        // Sort by increasing height in case consumer tries to snap to ground.
        moveObjects.sort((a, b) => {
            const aPos = a.getPosition();
            const bPos = b.getPosition();
            return aPos.z - bPos.z;
        });

        // Only move up very slightly.  Trying to be more fancy opens up many
        // corner cases, including the exploration card(s) moving over.
        const dz = tokenExtent.z + 0.25;

        // Move objects.
        for (const moveObject of moveObjects) {
            // Unlock (otherwise will hover instead of falling).
            const objectType = moveObject.getObjectType();
            if (objectType !== ObjectType.Regular) {
                moveObject.setObjectType(ObjectType.Regular);
            }

            const above = moveObject.getPosition().add([0, 0, dz]);
            moveObject.setPosition(above);

            // DO NOT RESTORE LOCK.
        }

        return moveObjects;
    }

    /**
     * Place token at pos/rot, moving other things up.
     * ANY MOVED LOCKED UNITS GET UNLOCKED (relocking is finicky).
     *
     * @param {GameObject} tokenObj
     * @param {Vector} pos
     * @param {Rotator} rot
     */
    static reserveTokenSpaceAndAnchorToken(tokenObj, pos, rot) {
        assert(tokenObj instanceof GameObject);
        assert(typeof pos.x === "number");
        assert(typeof rot.yaw === "number");

        // Move units out of the way (upward).
        const movedObjects = Explore.reserveTokenSpace(tokenObj, pos);
        assert(Array.isArray(movedObjects));

        // Move token to position, ground it.  If this position isn't
        // exact there will be a future onMovementStopped event.
        const objectType = tokenObj.getObjectType();
        if (objectType !== ObjectType.Regular) {
            tokenObj.setObjectType(ObjectType.Regular);
        }
        tokenObj.setPosition(pos);
        tokenObj.setRotation(rot);
        tokenObj.setObjectType(ObjectType.Ground);
    }

    static removeFrontierToken(systemTileObj) {
        assert(systemTileObj instanceof GameObject);

        const systemPos = systemTileObj.getPosition();
        const systemHex = Hex.fromPosition(systemPos);

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid != "token:pok/frontier") {
                continue;
            }
            const pos = obj.getPosition();
            const hex = Hex.fromPosition(pos);
            if (hex !== systemHex) {
                continue;
            }
            obj.destroy();
            break;
        }
    }

    static resolveExplore(card, planet, pos, rot, player) {
        assert(card instanceof Card);
        assert(player instanceof Player);

        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        let playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        playerName = playerName.charAt(0).toUpperCase() + playerName.slice(1); // capitalize
        const planetName = planet
            ? planet.getNameStr()
            : locale("token.frontier");
        let exploreResult = card.getCardDetails().name;
        exploreResult = exploreResult.replace(/ \(\d\)$/, ""); // strip off card number ("morale boost (2)")
        const msg = locale("ui.message.exploring", {
            playerName,
            planetName,
            exploreResult,
        });
        const color = playerDesk ? playerDesk.color : undefined;
        Broadcast.chatAll(msg, color);

        // Is there an attachment?
        const nsid = ObjectNamespace.getNsid(card);
        let attachmentData = false;
        let tokenNsid = false;
        for (const attachment of ATTACHMENTS) {
            if (attachment.cardNsid === nsid) {
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
        if (planet && !planet.firstTech) {
            tokenRot.roll = 180;
        }

        // Find token, might be in a bag.
        let tokenObj = false;
        if (!attachmentData.spawn) {
            for (const obj of world.getAllObjects()) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid === tokenNsid) {
                    tokenObj = obj;
                    const container = tokenObj.getContainer();
                    if (container) {
                        const above = container.getPosition().add([0, 0, 10]);
                        container.take(tokenObj, above);
                    }
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

        // Set rotation before moving, so in correct orientation before arriving.
        tokenObj.setRotation(tokenRot, 0);

        // Move to location.  THIS TRIGGERS tokenObj.onMovementStopped,
        // which Attachment uses to attach.
        Explore.reserveTokenSpaceAndAnchorToken(tokenObj, pos, tokenRot);

        // Extra cards? (Mirage)
        if (attachmentData.extraCardNsids) {
            const cards = CardUtil.gatherCards((nsid) => {
                return attachmentData.extraCardNsids.includes(nsid);
            });
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                card.setPosition(pos.add([0, 0, 11 + i]));
                card.setRotation(rot);
            }
        }
    }

    static getExploreDeck(planet, overrideTrait) {
        // Which trait to explore?
        const trait = overrideTrait ? overrideTrait : planet.firstTrait;
        if (!trait) {
            return;
        }

        // Sanity check trait is a known exploration deck.
        const deckNsidPrefix = `card.exploration.${trait}`;
        assert(DealDiscard.isKnownDeck(deckNsidPrefix));

        return deckNsidPrefix;
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

        const deckNsidPrefix = Explore.getExploreDeck(planet, overrideTrait);

        if (!deckNsidPrefix) {
            return;
        }

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
        pos.z = world.getTableHeight() + systemTileObj.getSize().z;

        // Draw the card.
        const count = 1;
        const rot = new Rotator(0, player.getRotation().yaw, 180);
        const above = pos.add([0, 0, 10]);
        const card = DealDiscard.dealToPosition(
            deckNsidPrefix,
            count,
            above,
            rot
        );
        if (!card) {
            return;
        }

        Explore.resolveExplore(card, planet, pos, rot, player);
    }

    /**
     * Add a UI element to card1 with a button that resolves the explore of
     * card1 and discards card2
     *
     * @param {Card} card1
     * @param {Card} card2
     */
    static addResolveUI(card1, card2, planet, pos, rot, player) {
        assert(card1 instanceof Card);
        assert(card2 instanceof Card);
        assert(player instanceof Player);

        Explore.removeResolveUI(card1);

        const button = WidgetFactory.button()
            .setFontSize(10)
            .setText(locale("ui.button.resolve_explore"));
        button.onClicked.add(() => {
            // get rid of both UIs
            Explore.removeResolveUI(card1);
            Explore.removeResolveUI(card2);
            // resolve this card and discard the other one
            Explore.resolveExplore(card1, planet, pos, rot, player);
            DealDiscard.discard(card2);
        });

        const ui = WidgetFactory.uiElement();
        ui.widget = button;

        const extent = card1.getExtent();
        ui.position = new Vector(-extent.x, 0, -extent.z - 0.1);
        ui.rotation = new Rotator(180, 180, 0);

        card1.addUI(ui);
    }

    /**
     * Remove all UI elements from a game object
     *
     * @param {GameObejct} card
     */
    static removeResolveUI(card) {
        for (const ui of card.getUIs()) {
            card.removeUIElement(ui);
            WidgetFactory.release(ui);
        }
    }

    /**
     * Draw two explore cards, provide ui to allow player to choose which
     * one to resolve, e.g. for Naaz-rohka distant suns faction ability.
     *
     * @param {GameObject} systemTileObj
     * @param {Planet || null} planet
     * @param {string || null} overrideTrait
     * @param {Player} player
     * @returns null
     */
    static doubleExplore(systemTileObj, planet, overrideTrait, player) {
        assert(systemTileObj instanceof GameObject);
        assert(!overrideTrait || typeof overrideTrait === "string");
        assert(player instanceof Player);

        const deckNsidPrefix = Explore.getExploreDeck(planet, overrideTrait);
        if (!deckNsidPrefix) {
            return;
        }

        // where to draw the cards?
        let basePos = false;
        if (planet) {
            basePos = PositionToPlanet.getWorldPosition(
                systemTileObj,
                planet.position
            );
        } else {
            basePos = systemTileObj.getPosition();
        }
        basePos.z = world.getTableHeight() + systemTileObj.getExtent().z;

        const pos1 = basePos.add(new Vector(0, -1, 0));
        const pos2 = basePos.add(new Vector(0, 1, 0));

        // draw the cards, drawing them separately so it is obvious that multiple
        // cards were drawn
        const rot = new Rotator(0, player.getRotation().yaw, 180);
        const card1 = DealDiscard.dealToPosition(
            deckNsidPrefix,
            1,
            pos1.add([0, 0, 10]),
            rot
        );
        const card2 = DealDiscard.dealToPosition(
            deckNsidPrefix,
            1,
            pos2.add([0, 0, 10]),
            rot
        );
        if (!card1 || !card2) {
            return;
        }

        // create buttons to select which card to resolve
        Explore.addResolveUI(card1, card2, planet, basePos, rot, player);
        Explore.addResolveUI(card2, card1, planet, basePos, rot, player);
    }
}

module.exports = { Explore };
