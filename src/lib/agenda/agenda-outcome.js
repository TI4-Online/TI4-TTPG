const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { world } = require("../../wrapper/api");

const OUTCOME_TYPE = {
    FOR_AGAINST: "for/against",
    PLAYER: "player",
    STRATEGY_CARD: "strategy card",
    OTHER: "other",
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Represent a single outcome for an agenda.
 */
class AgendaOutcome {
    static isOutcomeType(outcomeType) {
        assert(typeof outcomeType === "string");
        return Object.values(OUTCOME_TYPE).includes(outcomeType);
    }

    static getDefaultOutcomeNames(outcomeType) {
        assert(typeof outcomeType === "string");
        switch (outcomeType) {
            case OUTCOME_TYPE.FOR_AGAINST:
                return [
                    locale("ui.agenda.outcome.for"),
                    locale("ui.agenda.outcome.against"),
                ];
            case OUTCOME_TYPE.PLAYER:
                return world.TI4.getAllPlayerDesks().map((desk) => {
                    return capitalizeFirstLetter(desk.colorName);
                });
            case OUTCOME_TYPE.STRATEGY_CARD:
                return [
                    locale("tile.strategy.leadership"),
                    locale("tile.strategy.diplomacy"),
                    locale("tile.strategy.politics"),
                    locale("tile.strategy.construction"),
                    locale("tile.strategy.trade"),
                    locale("tile.strategy.warfare"),
                    locale("tile.strategy.technology"),
                    locale("tile.strategy.imperial"),
                ];
            case OUTCOME_TYPE.OTHER:
                return Array(8).fill("?");
        }
    }

    constructor() {
        throw new Error("static only");
    }
}

module.exports = { AgendaOutcome, OUTCOME_TYPE };
