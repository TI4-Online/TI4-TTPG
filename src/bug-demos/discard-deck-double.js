/**
 * We've observed a very rare issue where after discarding a card the entire deck is doubled.
 */

const { Card, Vector, world } = require("@tabletop-playground/api");

const deck = world.createObjectFromTemplate(
    "A1DF1F8D4017589C5F9490A08EE6E05C",
    new Vector(0, 0, world.getTableHeight() + 5)
);
const container = world.createObjectFromTemplate(
    "C134C94B496A8D48C79534A5BDBC8A3D",
    new Vector(0, 20, world.getTableHeight() + 5)
);

const origDeckSize = deck.getStackSize();
let card = undefined;
let cycleCount = 0;
let stepIndex = 0;

const STEPS = [
    () => {
        // Validate.
        if (!(deck instanceof Card)) {
            throw new Error("bad deck");
        }

        const deckSize = deck.getStackSize();
        if (deckSize > origDeckSize) {
            throw new Error(
                `deck orig ${origDeckSize}, now ${deckSize} (${cycleCount} cycles)`
            );
        }

        if (cycleCount % 100 === 0) {
            console.log(
                `cycle ${cycleCount}, deckSize ${deckSize}/${origDeckSize}`
            );
        }

        cycleCount++;
    },
    () => {
        // Draw a card.
        const numCards = 1;
        const fromFront = false;
        const offset = 0;
        const keep = false;
        card = deck.takeCards(numCards, fromFront, offset, keep);
        if (!card) {
            throw new Error("takeCards failed");
        }
        if (!(card instanceof Card)) {
            throw new Error("bad card");
        }
    },
    () => {
        // Put card into a container.
        const index = 0;
        const showAnimation = false;
        container.addObjects([card], index, showAnimation);

        // Remove card from container.
        const pos = container.getPosition().add([0, 0, 10]);
        let success = container.take(card, pos, showAnimation);
        if (!success) {
            throw new Error("container.take failed");
        }

        // Shuffle (same frame as addCards)
        deck.shuffle();

        // Return card.
        const toFront = true;
        const offset = 0;
        const animate = true;
        const flipped = true;
        success = deck.addCards(card, toFront, offset, animate, flipped);
        if (!success) {
            throw new Error("addCards failed");
        }
    },
];

function demo() {
    console.log("demo");
    deck.setInheritScript(false);

    const doStep = () => {
        const step = STEPS[stepIndex];
        step();
        stepIndex = (stepIndex + 1) % STEPS.length;
        setTimeout(doStep, stepIndex > 0 ? 100 : 1000);
    };
    process.nextTick(doStep);
}

demo();
