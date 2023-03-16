require("../../global"); // register world.TI4
const assert = require("assert");
const { AttachmentSchema } = require("./attachment.schema");
const { Attachment } = require("./attachment");
const { ObjectNamespace } = require("../../lib/object-namespace");

it("ATTACHMENTS attirbutes validate", () => {
    Attachment.getAllAttachments().forEach((attrs) => {
        assert(AttachmentSchema.validate(attrs.raw));
    });
});

it("ATTACHMENTS nsids", () => {
    Attachment.getAllAttachments().forEach((attrs) => {
        if (attrs.cardNsid) {
            assert(ObjectNamespace.parseNsid(attrs.cardNsid));
        }
        if (attrs.tokenNsid) {
            assert(ObjectNamespace.parseNsid(attrs.tokenNsid));
        }
    });
});
