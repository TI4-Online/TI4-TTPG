// time in seconds since epoch
module.exports = (data) => {
    data.timestamp = Date.now() / 1000;
};
