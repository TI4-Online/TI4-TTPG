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

    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
}

module.exports = Color;
