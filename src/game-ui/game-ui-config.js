const SCALE = 2;

module.exports = {
    scale: SCALE,
    padding: 10 * SCALE,
    spacing: 10 * SCALE,
    fontSize: 20 * SCALE,
    spacerColor: [0.02, 0.02, 0.02],

    // Raise button above surface for ray z-fighting (0.04 appears to be enough, be paranoid).
    // Was using 0.1 but still saw a "cannot click button" issue.
    buttonLift: 0.2,
};
