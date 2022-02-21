const { refObject } = require("../../wrapper/api");
const { Attachment } = require("./attachment");
const { ATTACHMENTS } = require("./attachment.data");

const ATTRS = ATTACHMENTS.filter((element) =>
    element.localeName.includes("tomb_of_emphidia")
)[0];

new Attachment(refObject, ATTRS);
