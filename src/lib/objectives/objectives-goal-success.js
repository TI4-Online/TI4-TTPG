const assert = require("../../wrapper/assert-wrapper");
const { ObjectivesGoalCount } = require("./objectives-goal-count");
const { world } = require("../../wrapper/api");

/**
 * Summarize per-desk goal progress as a user-facing string, and report success boolean.
 *
 * Results are always Object.{header:string,values:Array.{value:string|number,success:boolean}}}
 */
class ObjectivesGoalSuccess {
    constructor() {
        throw new Error("static only");
    }

    static checkFlagshipOrWarSun(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countFlagshipsAndWarSuns().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Flagship or warsuns",
            values,
        };
    }

    static checkInfluence(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countInfResTgs().map((value) => {
            const { inf, res, tgs } = value;
            assert(typeof inf === "number");
            assert(typeof res === "number");
            assert(typeof tgs === "number");
            let neededTgs = needed - inf;
            const success = tgs >= neededTgs;
            return {
                value: `${inf}/${tgs}`,
                success,
            };
        });
        return {
            header: "INF/TGS",
            values,
        };
    }

    static checkInfResTgs(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countInfResTgs().map((value) => {
            const { inf, res, tgs } = value;
            assert(typeof inf === "number");
            assert(typeof res === "number");
            assert(typeof tgs === "number");
            let neededTgs = needed;
            if (inf < needed) {
                neededTgs += needed - inf;
            }
            if (res < needed) {
                neededTgs += needed - res;
            }
            const success = tgs >= neededTgs;
            return {
                value: `${inf}/${res}/${tgs}`,
                success,
            };
        });
        return {
            header: "INF/RES/TGS",
            values,
        };
    }

    static checkMaxNonFighterShipsInSingleSystem(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countMaxNonFighterShipsInSingleSystem().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Non-figher ships",
            values,
        };
    }

    static checkMorePlanetsThan2Neighbors() {
        let values = ObjectivesGoalCount.countPlanetsAndGetNeighbors();
        values = values.map((value) => {
            const { planets, neighbors } = value;
            assert(typeof planets === "number");
            assert(Array.isArray(neighbors));
            for (const neighborIndex of neighbors) {
                assert(
                    neighborIndex >= 0 &&
                        neighborIndex < world.TI4.config.playerCount
                );
            }
            let moreThanCount = 0;
            for (const neighborIndex of neighbors) {
                const neighborCount = values[neighborIndex].planets;
                if (planets > neighborCount) {
                    moreThanCount++;
                }
            }
            return {
                value: planets,
                success: moreThanCount >= 2,
            };
        });
        return {
            header: "Planets",
            values,
        };
    }

    static checkPlanetsInOthersHome(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countPlanetsInOthersHome().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Planets others' home",
            values,
        };
    }

    static checkPlanetsNonHome(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countPlanetsNonHome().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Planets non-home",
            values,
        };
    }

    static checkPlanetsSameTrait(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countPlanetTraits().map((value) => {
            const { cultural, industrial, hazardous } = value;
            assert(typeof cultural === "number");
            assert(typeof industrial === "number");
            assert(typeof hazardous === "number");
            const max = Math.max(cultural, industrial, hazardous);
            return {
                value: `${cultural}/${industrial}/${hazardous}`,
                success: max >= needed,
            };
        });
        return {
            header: "CUL/IND/HAZ",
            values,
        };
    }

    static checkPlanetsWithAttachments(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countPlanetsWithAttachments().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Planets w/attach",
            values,
        };
    }

    static checkPlanetsWithStructuresOutsidePlayersHome(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countPlanetsWithStructuresOutsidePlayersHome().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Planets w/structures non-home",
            values,
        };
    }

    static checkPlanetsWithTechSpecialties(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countPlanetsWithTechSpecialties().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Planets w/tech",
            values,
        };
    }

    static checkResources(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countInfResTgs().map((value) => {
            const { inf, res, tgs } = value;
            assert(typeof inf === "number");
            assert(typeof res === "number");
            assert(typeof tgs === "number");
            let neededTgs = needed - res;
            const success = tgs >= neededTgs;
            return {
                value: `${res}/${tgs}`,
                success,
            };
        });
        return {
            header: "RES/TGS",
            values,
        };
    }

    static checkStructures(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countStructures().map((value) => {
            assert(typeof value === "number");
            return {
                value,
                success: value >= needed,
            };
        });
        return {
            header: "Structures",
            values,
        };
    }

    static checkSystemsWithControlledPlanetsInOrAdjToOthersHome(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithControlledPlanetsInOrAdjToOthersHome().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems",
            values,
        };
    }

    static checkSystemsWithFlagshipOrWarSunAlsoOthersHomeOrMecatol(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithFlagshipOrWarSunAlsoOthersHomeOrMecatol().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems",
            values,
        };
    }

    static checkSystemsWithoutPlanetsWithUnits(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithoutPlanetsWithUnits().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems",
            values,
        };
    }

    static checkSystemsWithShipsAdjToMecatol(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithShipsAdjToMecatol().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems",
            values,
        };
    }

    static checkSystemsWithUnitsInLegendaryMecatolOrAnomaly(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithUnitsInLegendaryMecatolOrAnomaly().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems L/M/A",
            values,
        };
    }

    static checkSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome(needed) {
        assert(typeof needed === "number");
        const values =
            ObjectivesGoalCount.countSystemsWithUnitsOnEdgeOfGameBoardOtherThanHome().map(
                (value) => {
                    assert(typeof value === "number");
                    return {
                        value,
                        success: value >= needed,
                    };
                }
            );
        return {
            header: "Systems w/units edge non-home",
            values,
        };
    }

    static checkTwoTechInColors(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countTechnologyColors().map(
            (value) => {
                const { blue, green, red, yellow } = value;
                assert(typeof blue === "number");
                assert(typeof green === "number");
                assert(typeof red === "number");
                assert(typeof yellow === "number");
                let countIn2Color = 0;
                if (blue >= 2) {
                    countIn2Color++;
                }
                if (green >= 2) {
                    countIn2Color++;
                }
                if (red >= 2) {
                    countIn2Color++;
                }
                if (yellow >= 2) {
                    countIn2Color++;
                }
                const success = countIn2Color >= needed;
                return {
                    value: `${blue}/${green}/${yellow}/${red}`,
                    success,
                };
            }
        );
        return {
            header: "BLUE/GREEN/YELLOW/RED",
            values,
        };
    }

    static checkTokensInTacticAndStrategy(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countTokensInTacticAndStrategy().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Tokens",
            values,
        };
    }

    static checkTradegoods(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countTradegoods().map((value) => {
            assert(typeof value === "number");
            return {
                value,
                success: value >= needed,
            };
        });
        return {
            header: "Tradegoods",
            values,
        };
    }

    static checkUnitUpgrades(needed) {
        assert(typeof needed === "number");
        const values = ObjectivesGoalCount.countUnitUpgradeTechnologies().map(
            (value) => {
                assert(typeof value === "number");
                return {
                    value,
                    success: value >= needed,
                };
            }
        );
        return {
            header: "Unit Upgrades",
            values,
        };
    }
}

module.exports = { ObjectivesGoalSuccess };
