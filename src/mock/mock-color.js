class Color {
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    toHex() {
        return "00000000";
    }
}

module.exports = Color;
