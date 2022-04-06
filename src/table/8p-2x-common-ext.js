/*

[136.197,0] // common
[0,144.17] //red
[-84.7411,116.636] //green
[-137.114,44.551]
[-137.114,-44.5511]
[-84.7411,-116.636]
[84.7411,116.636] //yellow
[84.7412,-116.636]
[0,-144.17]
rotation is increments of 36-degrees
rotation step 18 (common wrt 90)

*/
module.exports = {
    desks: [
        // North (right to left)
        {
            colorName: "green",
            hexColor: "#5AE35A",
            plasticHexColor: "#00A306",
            pos: { x: 116.636, y: 84.7411 },
            yaw: 126,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "red",
            hexColor: "#FF2417",
            plasticHexColor: "#CB0000",
            pos: { x: 144.17, y: 0 },
            yaw: 90,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6, 7, 8],
        },
        {
            colorName: "yellow",
            hexColor: "#FFDA00",
            plasticHexColor: "#FFDA00",
            pos: { x: 116.636, y: -84.7411 },
            yaw: 54,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        // West
        {
            colorName: "pink",
            hexColor: "#FF84D6",
            plasticHexColor: "#F46FCD",
            pos: { x: 44.551, y: -137.114 },
            yaw: 18,
            defaultPlayerSlot: 5,
            playerCounts: [7, 8],
        },
        {
            colorName: "orange",
            hexColor: "#FF932B",
            plasticHexColor: "#FF7603",
            pos: { x: -44.551, y: -137.114 },
            yaw: -18,
            defaultPlayerSlot: 6,
            playerCounts: [8],
        },
        // South (left to right)
        {
            colorName: "purple",
            hexColor: "#C800FF",
            plasticHexColor: "#5E219C",
            pos: { x: -116.636, y: -84.7411 },
            yaw: -54,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6, 7, 8],
        },
        {
            colorName: "blue",
            hexColor: "#07B2FF",
            plasticHexColor: "#07B2FF",
            pos: { x: -144.17, y: 0 },
            yaw: -90,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6, 7, 8],
        },
        {
            colorName: "white",
            hexColor: "#BABABA",
            plasticHexColor: "#C1C1C1",
            pos: { x: -116.636, y: 84.7411 },
            yaw: -126,
            defaultPlayerSlot: 8, // want 18 but zone bug prevents ownership, use very light blue for "white",
            playerCounts: [4, 5, 6, 7, 8],
        },
    ],
    deskLayout: {
        anchor: {
            gameUI: {
                pos: { x: 29, y: 147, z: 0 },
                yaw: 0,
                width: 1000,
                height: 520,
            },
            score: { pos: { x: -33, y: 147, z: 0 }, yaw: 0 },
            strategy: { pos: { x: 77, y: 147, z: 0 }, yaw: 0 },
        },
    },
};
