// desk angles: 27, 9

module.exports = {
    desks: [
        // North (right to left)
        {
            colorName: "green",
            pos: { x: 80.5, y: 149.51 },
            yaw: 117,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "red",
            pos: { x: 112.3, y: 51.5 },
            yaw: 99,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6, 7, 8],
        },
        {
            colorName: "yellow",
            pos: { x: 112.3, y: -51.5 },
            yaw: 81,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "pink",
            pos: { x: 80.5, y: -149.51 },
            yaw: 63,
            defaultPlayerSlot: 5,
            playerCounts: [7, 8],
        },
        // South (left to right)
        {
            colorName: "orange",
            pos: { x: -80.5, y: -149.51 },
            yaw: -63,
            defaultPlayerSlot: 6,
            playerCounts: [8],
        },
        {
            colorName: "purple",
            pos: { x: -112.3, y: -51.5 },
            yaw: -81,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6, 7, 8],
        },
        {
            colorName: "blue",
            pos: { x: -112.3, y: 51.5 },
            yaw: -99,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6, 7, 8],
        },
        {
            colorName: "white",
            pos: { x: -80.5, y: 149.51 },
            yaw: -117,
            defaultPlayerSlot: 18,
            playerCounts: [4, 5, 6, 7, 8],
        },
    ],
    deskLayout: {
        anchor: {
            gameUI: {
                pos: { x: 0, y: 210, z: 0 },
                yaw: 90, // rotate facing table center
                width: 1000,
                height: 520,
            },
            score: {
                pos: { x: 0, y: -196, z: 0 },
                yaw: -90, //
            },
            strategy: {
                pos: { x: 0, y: 167, z: 0 },
                yaw: 90, // facing table center
            },
        },
    },
    supportsLargeHexes: false,
};
