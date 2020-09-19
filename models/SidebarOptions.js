const {
    Schema
} = require("mongoose");

const SidebarOptionsSchema = new Schema({
    title: String,
    closedIcon: String,
    isActive: Boolean,
});

module.exports = SidebarOptionsSchema;
