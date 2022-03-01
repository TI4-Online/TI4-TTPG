const assert = require("assert");
const { AttachmentSchema } = require("./attachment.schema");
const { ATTACHMENTS } = require("./attachment.data");
const { ObjectNamespace } = require("../../lib/object-namespace");

it("ATTACHMENTS attirbutes validate", () => {
    ATTACHMENTS.forEach((attrs) => {
        assert(AttachmentSchema.validate(attrs));
    });
});

it("ATTACHMENTS nsids", () => {
    ATTACHMENTS.forEach((attrs) => {
        if (attrs.cardNsid) {
            assert(ObjectNamespace.parseNsid(attrs.cardNsid));
        }
        if (attrs.tokenNsid) {
            assert(ObjectNamespace.parseNsid(attrs.tokenNsid));
        }
    });
});
