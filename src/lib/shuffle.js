class Shuffle {
    static shuffle(a) {
        // Fisher-Yates
        for (let i = a.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // return one item randomly from an un-shuffled array
    static drawRandom(a) {
        return a[Math.floor(Math.random() * a.length)];
    }
}
module.exports = { Shuffle };
