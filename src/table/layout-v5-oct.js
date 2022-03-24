/*
stretched octagon
[45.7014,140.309] 180 -- blue
[144.915,99.2137] 135
[186.011,-2.12326e-05] 90
[144.915,-99.2137] 45
[45.7014,-140.309] 0
[-44.9879,-140.309] 0
[-144.202,-99.2137] -45
[-185.297,-4.14748e-05] -90
[-144.202,99.2137] -135
[-44.9879,140.309] -180 -- purple
*/
module.exports = {
    desks: [
        // North (right to left)
        {
            colorName: "green",
            hexColor: "#5AE35A",
            plasticHexColor: "#00A306",
            pos: { x: -144.202, y: 99.2137 },
            yaw: -135,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "red",
            hexColor: "#FF2417",
            plasticHexColor: "#CB0000",
            pos: { x: -45.7, y: 140.3 },
            yaw: 180,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6, 7, 8],
        },
        {
            colorName: "yellow",
            hexColor: "#FFDA00",
            plasticHexColor: "#FFDA00",
            pos: { x: 45.7, y: 140.3 },
            yaw: 180,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        // West
        {
            colorName: "pink",
            hexColor: "#FF84D6",
            plasticHexColor: "#F46FCD",
            pos: { x: 144.202, y: 99.2137 },
            yaw: 135,
            defaultPlayerSlot: 5,
            playerCounts: [7, 8],
        },
        {
            colorName: "orange",
            hexColor: "#FF932B",
            plasticHexColor: "#FF7603",
            pos: { x: 144.202, y: -99.2137 },
            yaw: 45,
            defaultPlayerSlot: 6,
            playerCounts: [8],
        },
        // South (left to right)
        {
            colorName: "purple",
            hexColor: "#C800FF",
            plasticHexColor: "#5E219C",
            pos: { x: 45.7, y: -140.3 },
            yaw: 0,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6, 7, 8],
        },
        {
            colorName: "blue",
            hexColor: "#07B2FF",
            plasticHexColor: "#07B2FF",
            pos: { x: -45.7, y: -140.3 },
            yaw: 0,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6, 7, 8],
        },
        {
            colorName: "white",
            hexColor: "#BABABA",
            plasticHexColor: "#C1C1C1",
            pos: { x: -144.202, y: -99.2137 },
            yaw: -45,
            defaultPlayerSlot: 18,
            playerCounts: [4, 5, 6, 7, 8],
        },
    ],
    deskLayout: {
        anchor: {
            gameUI: {
                pos: { x: -185, y: 15, z: 0 },
                yaw: 90,
                width: 1000,
                height: 520,
            },
            score: { pos: { x: 172, y: 0, z: 0 }, yaw: 90 },
            strategy: { pos: { x: -185, y: -25, z: 0 }, yaw: 90 },
        },
    },
};
