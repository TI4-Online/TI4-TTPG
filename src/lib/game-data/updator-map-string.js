const { MapStringSave } = require("../map-string/map-string-save");

module.exports = (data) => {
    data.mapString = MapStringSave.save();
};
