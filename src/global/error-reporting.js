// Send error reports to an external site
// WORK IN PROGRESS, NOT YET INCLUDED IN BUILD

const _seen = new Set();

// eslint-disable-next-line no-undef
$uncaughtException = (err) => {
    const str = `${err.stack}`;
    if (_seen.has(str)) {
        return; // only report once
    }
    _seen.add(str);
    console.log(`err:${str}`);
};

throw new Error("test err");
