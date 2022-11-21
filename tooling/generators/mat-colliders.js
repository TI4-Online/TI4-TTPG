const path = require("path");
const { ConvexCollider } = require("../experimental/convex-collider");

const MATS_DIR = path.join(__dirname, "/../../assets/Models/mats");
const MATS = [
    { path: "agenda_laws_mat.obj" },
    { path: "build_area.obj" },
    { path: "decks_mat.obj" },
    { path: "exploration_mat.obj" },
    { path: "laws_mat.obj" },
    { path: "objective_mat_1.obj" },
    { path: "objective_mat_2.obj" },
    { path: "planet_mat.obj" },
    { path: "secrets_mat.obj" },
];

for (const mat of MATS) {
    const srcFile = path.join(MATS_DIR, mat.path);

    const dir = path.dirname(srcFile);
    const basename = path.basename(srcFile, ".obj");
    const dstFile = path.join(dir, basename + "_col.obj");

    ConvexCollider.processSimple(srcFile, dstFile);
}
