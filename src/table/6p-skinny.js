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
            pos: { x: 76.636, y: 84.7411 },
            yaw: 126,
            defaultPlayerSlot: 1,
            playerCounts: [3, 4, 5, 6],
        },
        {
            colorName: "red",
            pos: { x: 104.17, y: 0 },
            yaw: 90,
            defaultPlayerSlot: 16,
            playerCounts: [2, 5, 6],
        },
        {
            colorName: "yellow",
            pos: { x: 76.636, y: -84.7411 },
            yaw: 54,
            defaultPlayerSlot: 9,
            playerCounts: [3, 4, 5, 6],
        },
        // South (left to right)
        {
            colorName: "purple",
            pos: { x: -76.636, y: -84.7411 },
            yaw: -54,
            defaultPlayerSlot: 4,
            playerCounts: [4, 5, 6],
        },
        {
            colorName: "blue",
            pos: { x: -104.17, y: 0 },
            yaw: -90,
            defaultPlayerSlot: 15,
            playerCounts: [1, 2, 3, 6],
        },
        {
            colorName: "white",
            pos: { x: -76.636, y: 84.7411 },
            yaw: -126,
            defaultPlayerSlot: 18,
            playerCounts: [4, 5, 6],
        },
    ],
    deskLayout: {
        anchor: {
            gameUI: {
                // "rotated down" style:
                //pos: { x: 0, y: 147, z: 0 },
                //yaw: 0,
                pos: { x: 0, y: 150, z: 0 },
                yaw: 90, // rotate facing table center
                width: 1000,
                height: 520,
            },
            //score: { pos: { x: 10, y: -147, z: 0 }, yaw: 0 },
            score: {
                pos: { x: 0, y: -136, z: 0 },
                yaw: -90, //
            },
            //strategy: { pos: { x: 44, y: 147, z: 0 }, yaw: 0 },
            strategy: {
                pos: { x: 0, y: 107, z: 0 },
                yaw: 90, // facing table center
            },
        },
    },
};
