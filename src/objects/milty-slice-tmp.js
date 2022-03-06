const { MiltySliceLayout } = require("../lib/draft/milty/milty-slice-layout");
const { refObject, world } = require("../wrapper/api");

const SLICES = [
    {
        sliceStr: "39,35,41,66,74",
        label: "Hope",
    },
    {
        sliceStr: "26,30,59,67,49",
        label: "Golden Corral",
    },
    {
        sliceStr: "27,69,78,64,44",
        label: "Tom Hanks",
    },
    {
        sliceStr: "43,61,36,40,73",
        label: "Live Free or Gash Hard",
    },
    {
        sliceStr: "50,37,76,20,68",
        label: "Mama's Drama",
    },
    {
        sliceStr: "65,24,46,79,28",
        label: "Antimassachusetts",
    },
    {
        sliceStr: "42,25,29,47,62",
        label: "Chili Dogs on the Beach",
    },
];

refObject.addCustomAction("*LAYOUT SLICE");

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    const pos = obj.getPosition();
    const closestDesk = world.TI4.getClosestPlayerDesk(pos);

    const sliceStr = obj.getDescription();
    const playerSlot = closestDesk.playerSlot;
    MiltySliceLayout.doLayout(sliceStr, playerSlot);
});
