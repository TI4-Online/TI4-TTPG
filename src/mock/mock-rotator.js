class Rotator {
    constructor(pitch, yaw, roll) {
        this.pitch = pitch;
        this.yaw = yaw;
        this.roll = roll;
    }

    compose() {
        return this;
    }
}

module.exports = Rotator;
