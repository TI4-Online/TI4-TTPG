const {
    refObject,
    DrawingLine,
    Color,
    Vector,
} = require("@tabletop-playground/api");
const { AdjacencyHyperlane } = require("./adjacency-hyperlane");
const { Hex } = require("../hex");

const obj = refObject;
const objPos = obj.getPosition();
const z = objPos.z + obj.getExtent().z + 0.05;
objPos.z = z;
const hex = Hex.fromPosition(objPos);

console.log("xxx hex", hex);

obj.getDrawingLines().forEach((line) => obj.removeDrawingLineObject(line));

const adj = new AdjacencyHyperlane(hex).getAdjacent();
for (const adjHex of adj) {
    console.log("xxx adjHex", adjHex);

    const pos = Hex.toPosition(adjHex);
    pos.z = z;

    const line = new DrawingLine();
    line.color = new Color(1, 0, 0, 1);
    line.normals = [new Vector(0, 0, 1)];
    line.points = [objPos, pos].map((p) => obj.worldPositionToLocal(p));
    line.thickness = 1;
    obj.addDrawingLine(line);
}
