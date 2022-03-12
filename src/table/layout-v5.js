/*

9-slot
[142.717,-0.00044303]
[109.327,-91.737]
[24.7821,-140.549]
[-71.3589,-123.596]
[-134.11,-48.8116]
[-134.11,48.8125]
[-71.3581,123.597]
[24.783,140.549] // 2-blue
[109.328,91.7363] // 1-white
rotation is increments of 40-degrees

*/
module.exports = {
    desks: [
        // North (right to left)
        {
            colorName: "green",
            hexColor: "#5AE35A",
            plasticHexColor: "#00A306",
            pos: { x: -109.327, y: 91.737 },
            yaw: 230,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "red",
            hexColor: "#FF2417",
            plasticHexColor: "#CB0000",
            pos: { x: -24.7821, y: 140.549 },
            yaw: 190.0,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6, 7, 8],
        },
        {
            colorName: "yellow",
            hexColor: "#FFDA00",
            plasticHexColor: "#FFDA00",
            pos: { x: 71.3589, y: 123.596 },
            yaw: 150,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        // West
        {
            colorName: "pink",
            hexColor: "#FF84D6",
            plasticHexColor: "#F46FCD",
            pos: { x: 134.11, y: 48.8116 },
            yaw: 110.0,
            defaultPlayerSlot: 5,
            playerCounts: [7, 8],
        },
        {
            colorName: "orange",
            hexColor: "#FF932B",
            plasticHexColor: "#FF7603",
            pos: { x: 134.11, y: -48.8116 },
            yaw: 70,
            defaultPlayerSlot: 6,
            playerCounts: [8],
        },
        // South (left to right)
        {
            colorName: "purple",
            hexColor: "#C800FF",
            plasticHexColor: "#5E219C",
            pos: { x: 71.3581, y: -123.597 },
            yaw: 30,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6, 7, 8],
        },
        {
            colorName: "blue",
            hexColor: "#07B2FF",
            plasticHexColor: "#07B2FF",
            pos: { x: -24.783, y: -140.549 },
            yaw: 350.0,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6, 7, 8],
        },
        {
            colorName: "white",
            hexColor: "#BABABA",
            plasticHexColor: "#C1C1C1",
            pos: { x: -109.327, y: -91.737 },
            yaw: 310,
            defaultPlayerSlot: 18,
            playerCounts: [4, 5, 6, 7, 8],
        },
    ],
    deskLayout: {
        anchor: {
            score: { pos: { x: -150, y: 0, z: 0 }, yaw: 90 },
            strategy: { pos: { x: -70, y: 0, z: 0 }, yaw: 90 },
        },
    },
};
