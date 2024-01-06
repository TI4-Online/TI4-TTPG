const { world, ObjectType } = require("@tabletop-playground/api");

const z = world.getTableHeight() + 5;

const domino = world.createObjectFromTemplate(
    "92B8DB024CE185E7814C8C808C081B91",
    [0, 0, z]
);
domino.snapToGround();
domino.setObjectType(ObjectType.Ground);

const deck = world.createObjectFromTemplate(
    "A1DF1F8D4017589C5F9490A08EE6E05C",
    [20, 0, z]
);
const card1 = deck.takeCards(1);
const card2 = deck.takeCards(1);
deck.destroy();
card1.setPosition([0, 0, z]);
card1.snapToGround();
card2.setPosition([0, 0, z]);
card2.setRotation([0, 90, 0]);
card2.snapToGround();

const domino2 = world.createObjectFromTemplate(
    "92B8DB024CE185E7814C8C808C081B91",
    [0, 0, z]
);
domino2.snapToGround();

const onHit = (obj, otherObj, first, impactPoint, impulse) => {
    console.log(`onHit`);
};
domino.onHit.add(onHit);
card1.onHit.add(onHit);
card2.onHit.add(onHit);
domino2.onHit.add(onHit);
