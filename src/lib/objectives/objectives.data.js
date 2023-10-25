const { world } = require("../../wrapper/api");
const { ObjectivesUtil } = require("./objectives-util");

/**
 * Function returns an array from desk index to simple progress string.
 */
const NSID_TO_GET_PROGRESS = {
    // Spend 3 inf, 3 res, 3 tgs
    "card.objective.public_1:pok/amass_wealth": () => {
        const values = ObjectivesUtil.initialValues({
            inf: 0,
            res: 0,
            tgs: 0,
        });
        return {
            label: "INF/RES/TGS",
            values: values.map(
                (value) => `${value.inf}/${value.res}/${value.tgs}`
            ),
        };
    },

    //
};

module.exports = {
    NSID_TO_GET_PROGRESS,
};
