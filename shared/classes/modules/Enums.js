var Enums = {
    LOCK_NONE:"_none_",
    STATUS_NEW:"new",
    STATUS_DRAFT:"draft",
    STATUS_REVIEW:"review",
    STATUS_APPROVED:"approved",
    CTYPE_CELL:"cell",
    CTYPE_PRIORITY:"priority_def",
    CTYPE_ACTION:"action_def",
    CTYPE_MECH:"mech_def",
    CTYPE_COMMUNITY: "community_def", // edit by ycui, 04252013
    NA:"N/A"
};
if (typeof(module) !== "undefined") module.exports = Enums;