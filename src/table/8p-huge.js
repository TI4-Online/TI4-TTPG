module.exports = {
    desks: [
        // North (right to left)
        {
            colorName: "green",
            pos: { x: 184, y: 180 },
            yaw: 90,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "red",
            pos: { x: 184, y: 60 },
            yaw: 90,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6, 7, 8],
        },
        {
            colorName: "yellow",
            pos: { x: 184, y: -60 },
            yaw: 90,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6, 7, 8],
        },
        {
            colorName: "pink",
            pos: { x: 184, y: -180 },
            yaw: 90,
            defaultPlayerSlot: 5,
            playerCounts: [7, 8],
        },
        // South (left to right)
        {
            colorName: "orange",
            pos: { x: -184, y: -180 },
            yaw: -90,
            defaultPlayerSlot: 6,
            playerCounts: [8],
        },
        {
            colorName: "purple",
            pos: { x: -184, y: -60 },
            yaw: -90,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6, 7, 8],
        },
        {
            colorName: "blue",
            pos: { x: -184, y: 60 },
            yaw: -90,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6, 7, 8],
        },
        {
            colorName: "white",
            pos: { x: -184, y: 180 },
            yaw: -90,
            defaultPlayerSlot: 18,
            playerCounts: [4, 5, 6, 7, 8],
        },
    ],
    deskLayout: {
        anchor: {
            gameUI: {
                pos: { x: 29, y: 300, z: 0 },
                yaw: 0,
                width: 1000,
                height: 520,
            },
            score: { pos: { x: -33, y: 300, z: 0 }, yaw: 0 },
            strategy: { pos: { x: 77, y: 300, z: 0 }, yaw: 0 },
        },
    },
    supportsLargeHexes: true,
};
