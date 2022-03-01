const assert = require("../wrapper/assert-wrapper");
const { Broadcast } = require("../lib/broadcast");
const { DealDiscard } = require("../lib/card/deal-discard");
const locale = require("../lib/locale");
const { world } = require("../wrapper/api");

function shuffleAllDecks() {
    if (world.TI4.config.timestamp > 0) {
        console.log("shuffle: game in progress, aborting");
        return; // game in progress
    }
    Broadcast.chatAll(locale("ui.message.shuffling_all_decks"));

    const deckNsidPrefixes = [
        "card.objective.public_1",
        "card.objective.public_2",
        "card.action",
        "card.objective.secret",
        "card.exploration.cultural",
        "card.exploration.hazardous",
        "card.exploration.industrial",
        "card.exploration.frontier",
        "card.relic",
    ];

    const shuffleNext = () => {
        const deckNsidPrefix = deckNsidPrefixes.shift();
        if (!deckNsidPrefix) {
            return;
        }
        //console.log(`shuffling ${deckNsidPrefix}`);
        const deck = DealDiscard.getDeckWithReshuffle(deckNsidPrefix);
        assert(deck);
        deck.shuffle();
        process.nextTick(shuffleNext);
    };
    shuffleNext();
}

if (!world.__isMock) {
    process.nextTick(shuffleAllDecks);
}
