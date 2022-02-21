const assert = require("assert");
const { AttachmentSchema } = require("./attachment.schema");
const { ATTACHMENTS } = require("./attachment.data");

it("ATTACHMENTS attirbutes validate", () => {
    ATTACHMENTS.forEach((attrs) => {
        assert(AttachmentSchema.validate(attrs));
    });
});
