const path = require("path");
const { ConvexCollider } = require("../experimental/convex-collider");

const UNIT_DIR = path.join(__dirname, "/../../assets/Models/units");
const UNITS = [
    { path: "base/carrier.obj" },
    { path: "base/cruiser.obj" },
    { path: "base/destroyer.obj" },
    { path: "base/dreadnought.obj" },
    { path: "base/fighter.obj" },
    { path: "base/flagship.obj" },
    { path: "base/infantry.obj", options: { maxZ: 0 } },
    { path: "base/pds.obj", options: { maxZ: 0 } },
    { path: "base/spacedock.obj" },
    { path: "base/warsun.obj" },
    { path: "pok/mech.obj", options: { maxZ: 0 } },
];

for (const unit of UNITS) {
    const srcFile = path.join(UNIT_DIR, unit.path);

    const dir = path.dirname(srcFile);
    const basename = path.basename(srcFile, ".obj");
    const dstFile = path.join(dir, basename + "_col.obj");

    ConvexCollider.processUsingSoftwareRenderer(srcFile, dstFile, unit.options);
}
