const assert = require("../../wrapper/assert");
const { AuxData } = require("../unit/auxdata");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitAttrsSet } = require("../unit/unit-attrs-set");
const { UnitPlastic } = require("../unit/unit-plastic");
const { GameObject, Player, globalEvents } = require("../../wrapper/api");

let _activeSystemGameObject = false;
let _activatingPlayerSlot = false;

globalEvents.TI4.onSystemActivated.add((systemTile, player) => {
    assert(systemTile instanceof GameObject);
    assert(player instanceof Player);
    _activeSystemGameObject = systemTile;
    _activatingPlayerSlot = player.getSlot();

    new AutoRoller(
        _activeSystemGameObject,
        _activatingPlayerSlot
    ).prepareSpace();
});

class AutoRoller {
    constructor(systemTileGameObject, attackerPlayerSlot) {
        assert(systemTileGameObject instanceof GameObject);
        assert(ObjectNamespace.isSystemTile(systemTileGameObject));
        assert(typeof attackerPlayerSlot === "number");

        const parsed = ObjectNamespace.parseSystemTile(systemTileGameObject);
        this._tile = parsed.tile;
        this._hex = Hex.fromPosition(systemTileGameObject.getPosition());
        this._attackerPlayerSlot = attackerPlayerSlot;
    }

    prepareSpace() {
        const allPlastic = UnitPlastic.getAll();
        const hexPlastic = allPlastic.filter(
            (plastic) => plastic.hex === this._hex
        );

        const spaceUnitSet = new Set();
        new UnitAttrsSet().values().forEach((unitAttrs) => {
            if (unitAttrs.raw.ship) {
                spaceUnitSet.add(unitAttrs.raw.unit);
            }
        });
        const defenderSet = new Set();
        for (const plastic of hexPlastic) {
            if (!spaceUnitSet.has(plastic.unit)) {
                continue; // not a ship
            } else if (plastic.owningPlayerSlot < 0) {
                continue; // anonymous token
            } else if (plastic.owningPlayerSlot === this._attackerPlayerSlot) {
                continue; // attacker
            }
            defenderSet.add(plastic.owningPlayerSlot);
        }
        const [defenderPlayerSlot] = defenderSet.size == 1 ? defenderSet : [-1];

        const [attacker, defender] = AuxData.createForPair(
            this._attackerPlayerSlot,
            defenderPlayerSlot,
            this._hex
        );

        console.log(`attacker=${this._attackerPlayerSlot}`);
        console.log(`defender=${defenderPlayerSlot}`);

        console.log("SPACE COMBAT");
        for (const unit of UnitAttrs.getAllUnitTypes()) {
            if (attacker.has(unit)) {
                const spaceCombat =
                    attacker.unitAttrsSet.get(unit).raw.spaceCombat;
                console.log(
                    `${unit}: count=${attacker.count(unit)} dice=${
                        spaceCombat.dice
                    } hit=${spaceCombat.hit}`
                );
            }
        }
        const modifiers = attacker.unitModifiers.map((x) => x.raw.localeName);
        console.log(`unit modifiers: ${modifiers}`);
    }
    prepareGround() {}
}
