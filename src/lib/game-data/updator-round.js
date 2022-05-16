const { ObjectNamespace } = require("../object-namespace");
const { Card, world } = require("../../wrapper/api");

/**
 * Reading objects on snap points says not to trust it.  Use bounding boxes.
 */
module.exports = (data) => {
    data.round = 0;

    let mat1 = false;
    let mat2 = false;
    const objs1 = [];
    const objs2 = [];

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "mat:base/objectives_1") {
            mat1 = obj;
        } else if (nsid === "mat:base/objectives_2") {
            mat2 = obj;
        } else if (nsid.startsWith("card.objective.public_1")) {
            objs1.push(obj);
        } else if (nsid.startsWith("card.objective.public_2")) {
            objs2.push(obj);
        }
    }

    // Abort if sus.
    if (!mat1 || !mat2) {
        return;
    }

    const countInside = (mat, cards) => {
        let count = 0;
        const extent = mat.getExtent();
        for (const card of cards) {
            if (!(card instanceof Card)) {
                continue;
            }
            if (!card.isFaceUp()) {
                continue;
            }
            let pos = card.getPosition();
            pos = mat.worldPositionToLocal(pos);
            if (Math.abs(pos.x) < extent.x && Math.abs(pos.y) < extent.y) {
                count += 1;
            }
        }
        return count;
    };

    const count1 = countInside(mat1, objs1);
    const count2 = countInside(mat2, objs2);
    data.round = Math.max(count1 + count2 - 1, 0);
};
