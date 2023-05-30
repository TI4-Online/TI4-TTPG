class AbstractFixedSystemsGenerator {
    /**
     * Map from hex to system tile number.
     *
     * return {Object.{hex:string,tile:number}}
     */
    generateFixedSystems() {
        throw new Error("subclass must override this");
    }
}

module.exports = { AbstractFixedSystemsGenerator };
